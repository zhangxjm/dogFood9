const InventoryService = require('../services/inventoryService');
const { successResponse, errorResponse } = require('../utils/helpers');

class InventoryController {
  static async getAllParts(request, reply) {
    try {
      const result = InventoryService.getAllParts(request.query);
      return reply.send(successResponse(result, '获取备件列表成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('获取备件列表失败', 500, error.message));
    }
  }

  static async getPartById(request, reply) {
    try {
      const result = InventoryService.getPartById(request.params.id);
      if (!result) {
        return reply.code(404).send(errorResponse('备件不存在', 404));
      }
      return reply.send(successResponse(result, '获取备件详情成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('获取备件详情失败', 500, error.message));
    }
  }

  static async createPart(request, reply) {
    try {
      const result = InventoryService.createPart(request.body);
      return reply.code(201).send(successResponse(result, '备件创建成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('创建备件失败', 500, error.message));
    }
  }

  static async updatePart(request, reply) {
    try {
      const result = InventoryService.updatePart(request.params.id, request.body);
      return reply.send(successResponse(result, '备件更新成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('更新备件失败', 500, error.message));
    }
  }

  static async updateStock(request, reply) {
    try {
      const result = InventoryService.updateStock(request.params.id, request.body);
      return reply.send(successResponse(result, '库存更新成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('更新库存失败', 500, error.message));
    }
  }

  static async deletePart(request, reply) {
    try {
      InventoryService.deletePart(request.params.id);
      return reply.send(successResponse(null, '备件删除成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('删除备件失败', 500, error.message));
    }
  }

  static async smartDispatch(request, reply) {
    try {
      const result = InventoryService.smartDispatch(request.body);
      return reply.send(successResponse(result, result.message));
    } catch (error) {
      return reply.code(500).send(errorResponse('智能调度失败', 500, error.message));
    }
  }

  static async generatePurchaseSuggestion(request, reply) {
    try {
      const result = InventoryService.generatePurchaseSuggestion();
      return reply.send(successResponse(result, '获取采购建议成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('生成采购建议失败', 500, error.message));
    }
  }

  static async getStats(request, reply) {
    try {
      const result = InventoryService.getStats();
      return reply.send(successResponse(result, '获取库存统计成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('获取库存统计失败', 500, error.message));
    }
  }
}

module.exports = InventoryController;
