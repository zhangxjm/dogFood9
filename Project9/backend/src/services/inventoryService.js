const { getDb } = require('../utils/db');
const { captureError, captureMessage } = require('../utils/monitoring');
const { addJob } = require('../queues');

const transactionTypeMap = {
  in: '入库',
  out: '出库',
  adjust: '调整',
  purchase: '采购',
};

class InventoryService {
  static getAllParts(params = {}) {
    try {
      const db = getDb();
      const { page = 1, pageSize = 20, category, keyword, lowStock } = params;
      
      let sql = 'SELECT * FROM spare_parts WHERE 1=1';
      const queryParams = [];
      
      if (category) {
        sql += ' AND category = ?';
        queryParams.push(category);
      }
      if (keyword) {
        sql += ' AND (name LIKE ? OR part_code LIKE ? OR specification LIKE ?)';
        queryParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }
      if (lowStock) {
        sql += ' AND quantity <= min_stock';
      }
      
      const total = db.prepare(`SELECT COUNT(*) as count FROM (${sql})`).get(...queryParams).count;
      
      const offset = (page - 1) * pageSize;
      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      queryParams.push(pageSize, offset);
      
      const list = db.prepare(sql).all(...queryParams).map(item => ({
        ...item,
        stock_status: item.quantity <= item.min_stock ? 'low' : (item.quantity >= item.max_stock ? 'overstock' : 'normal'),
        stock_status_text: item.quantity <= item.min_stock ? '库存不足' : (item.quantity >= item.max_stock ? '库存过高' : '正常'),
      }));
      
      return { list, total, page, pageSize };
    } catch (error) {
      captureError(error, { module: 'InventoryService', method: 'getAllParts' });
      throw error;
    }
  }

  static getPartById(id) {
    try {
      const db = getDb();
      const part = db.prepare('SELECT * FROM spare_parts WHERE id = ?').get(id);
      
      if (!part) return null;
      
      const transactions = db.prepare(`
        SELECT it.*, wo.order_no, wo.title as work_order_title
        FROM inventory_transactions it
        LEFT JOIN work_orders wo ON wo.id = it.work_order_id
        WHERE it.part_id = ? 
        ORDER BY it.transaction_date DESC 
        LIMIT 50
      `).all(id).map(t => ({
        ...t,
        transaction_type_text: transactionTypeMap[t.transaction_type] || t.transaction_type,
      }));
      
      return {
        ...part,
        stock_status: part.quantity <= part.min_stock ? 'low' : (part.quantity >= part.max_stock ? 'overstock' : 'normal'),
        stock_status_text: part.quantity <= part.min_stock ? '库存不足' : (part.quantity >= part.max_stock ? '库存过高' : '正常'),
        transactions,
      };
    } catch (error) {
      captureError(error, { module: 'InventoryService', method: 'getPartById', id });
      throw error;
    }
  }

  static createPart(data) {
    try {
      const db = getDb();
      
      const result = db.prepare(`
        INSERT INTO spare_parts (part_code, name, category, specification, unit,
          quantity, min_stock, max_stock, unit_price, supplier, location, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.part_code,
        data.name,
        data.category,
        data.specification,
        data.unit,
        data.quantity || 0,
        data.min_stock || 10,
        data.max_stock || 100,
        data.unit_price || 0,
        data.supplier,
        data.location,
        data.description
      );

      addJob('inventory-alerts', 'inventory-alert', { partId: result.lastInsertRowid });

      captureMessage(`Spare part created: ${data.name}`, 'info', { 
        module: 'InventoryService', 
        id: result.lastInsertRowid 
      });
      
      return this.getPartById(result.lastInsertRowid);
    } catch (error) {
      captureError(error, { module: 'InventoryService', method: 'createPart' });
      throw error;
    }
  }

  static updatePart(id, data) {
    try {
      const db = getDb();
      
      const fields = [];
      const values = [];
      
      ['name', 'category', 'specification', 'unit', 'min_stock', 
       'max_stock', 'unit_price', 'supplier', 'location', 'description'].forEach(field => {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(data[field]);
        }
      });
      
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      db.prepare(`UPDATE spare_parts SET ${fields.join(', ')} WHERE id = ?`).run(...values);
      
      addJob('inventory-alerts', 'inventory-alert', { partId: id });

      captureMessage(`Spare part updated: ${id}`, 'info', { module: 'InventoryService', id });
      
      return this.getPartById(id);
    } catch (error) {
      captureError(error, { module: 'InventoryService', method: 'updatePart', id });
      throw error;
    }
  }

  static updateStock(id, data) {
    try {
      const db = getDb();
      const { transaction_type, quantity, work_order_id, operator, description } = data;
      
      const part = db.prepare('SELECT * FROM spare_parts WHERE id = ?').get(id);
      if (!part) {
        throw new Error('备件不存在');
      }

      let newQuantity = part.quantity;
      
      if (transaction_type === 'in' || transaction_type === 'purchase') {
        newQuantity += quantity;
      } else if (transaction_type === 'out') {
        if (part.quantity < quantity) {
          throw new Error('库存不足');
        }
        newQuantity -= quantity;
      } else if (transaction_type === 'adjust') {
        newQuantity = quantity;
      }

      db.prepare(`
        UPDATE spare_parts 
        SET quantity = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newQuantity, id);

      db.prepare(`
        INSERT INTO inventory_transactions (part_id, transaction_type, quantity, 
          work_order_id, operator, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, transaction_type, quantity, work_order_id || null, operator || '系统', description || '');

      addJob('inventory-alerts', 'inventory-alert', { partId: id });

      captureMessage(`Stock updated: ${id} ${transaction_type} ${quantity}`, 'info', { 
        module: 'InventoryService', 
        id,
        transaction_type,
        quantity,
        new_quantity: newQuantity,
      });
      
      return this.getPartById(id);
    } catch (error) {
      captureError(error, { module: 'InventoryService', method: 'updateStock', id });
      throw error;
    }
  }

  static deletePart(id) {
    try {
      const db = getDb();
      db.prepare('DELETE FROM spare_parts WHERE id = ?').run(id);
      captureMessage(`Spare part deleted: ${id}`, 'info', { module: 'InventoryService', id });
      return true;
    } catch (error) {
      captureError(error, { module: 'InventoryService', method: 'deletePart', id });
      throw error;
    }
  }

  static smartDispatch(data) {
    try {
      const db = getDb();
      const { work_order_id, parts_required } = data;
      
      const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(work_order_id);
      if (!order) {
        throw new Error('工单不存在');
      }

      const dispatchResults = [];
      const unavailableParts = [];

      for (const req of parts_required) {
        const part = db.prepare('SELECT * FROM spare_parts WHERE id = ? OR part_code = ?').get(req.part_id, req.part_code);
        
        if (!part) {
          unavailableParts.push({ ...req, reason: '备件不存在' });
          continue;
        }

        if (part.quantity < req.quantity) {
          unavailableParts.push({ 
            ...req, 
            part_id: part.id,
            part_name: part.name,
            available: part.quantity, 
            reason: '库存不足' 
          });
          continue;
        }

        this.updateStock(part.id, {
          transaction_type: 'out',
          quantity: req.quantity,
          work_order_id,
          operator: '系统自动调度',
          description: `工单 ${order.order_no} 自动调度出库`,
        });

        dispatchResults.push({
          part_id: part.id,
          part_code: part.part_code,
          part_name: part.name,
          quantity: req.quantity,
          success: true,
        });
      }

      captureMessage(`Smart dispatch completed for order: ${work_order_id}`, 'info', {
        module: 'InventoryService',
        workOrderId: work_order_id,
        dispatched: dispatchResults.length,
        unavailable: unavailableParts.length,
      });

      return {
        success: true,
        dispatch_results: dispatchResults,
        unavailable_parts: unavailableParts,
        message: `成功调度 ${dispatchResults.length} 项，${unavailableParts.length} 项无法满足`,
      };
    } catch (error) {
      captureError(error, { module: 'InventoryService', method: 'smartDispatch' });
      throw error;
    }
  }

  static generatePurchaseSuggestion() {
    try {
      const db = getDb();
      
      const lowStockParts = db.prepare(`
        SELECT * FROM spare_parts 
        WHERE quantity <= min_stock
        ORDER BY quantity ASC
      `).all();

      const suggestions = lowStockParts.map(part => {
        const suggestedQuantity = part.max_stock - part.quantity;
        const estimatedCost = suggestedQuantity * (part.unit_price || 0);
        
        return {
          part_id: part.id,
          part_code: part.part_code,
          part_name: part.name,
          specification: part.specification,
          current_quantity: part.quantity,
          min_stock: part.min_stock,
          max_stock: part.max_stock,
          suggested_quantity: suggestedQuantity,
          unit_price: part.unit_price,
          estimated_cost: estimatedCost,
          supplier: part.supplier,
          urgency: part.quantity === 0 ? 'urgent' : (part.quantity < part.min_stock / 2 ? 'high' : 'normal'),
          urgency_text: part.quantity === 0 ? '紧急' : (part.quantity < part.min_stock / 2 ? '高' : '普通'),
        };
      });

      const totalEstimatedCost = suggestions.reduce((sum, s) => sum + s.estimated_cost, 0);

      return {
        suggestions,
        total_parts: suggestions.length,
        total_estimated_cost: totalEstimatedCost,
      };
    } catch (error) {
      captureError(error, { module: 'InventoryService', method: 'generatePurchaseSuggestion' });
      throw error;
    }
  }

  static getStats() {
    try {
      const db = getDb();
      
      const totalParts = db.prepare('SELECT COUNT(*) as count FROM spare_parts').get().count;
      const totalValue = db.prepare('SELECT SUM(quantity * unit_price) as total FROM spare_parts').get().total || 0;
      const lowStockCount = db.prepare('SELECT COUNT(*) as count FROM spare_parts WHERE quantity <= min_stock').get().count;
      const overStockCount = db.prepare('SELECT COUNT(*) as count FROM spare_parts WHERE quantity >= max_stock').get().count;
      
      const byCategory = db.prepare(`
        SELECT category, COUNT(*) as count, SUM(quantity) as total_quantity
        FROM spare_parts 
        GROUP BY category
      `).all();
      
      return {
        total_parts: totalParts,
        total_value: totalValue,
        low_stock_count: lowStockCount,
        over_stock_count: overStockCount,
        by_category: byCategory,
      };
    } catch (error) {
      captureError(error, { module: 'InventoryService', method: 'getStats' });
      throw error;
    }
  }
}

module.exports = InventoryService;
