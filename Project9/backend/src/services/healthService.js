const { getDb } = require('../utils/db');
const { captureError, captureMessage } = require('../utils/monitoring');
const { calculateHealthScore, getHealthAssessment } = require('../utils/helpers');
const { addJob } = require('../queues');
const config = require('../config');

class HealthService {
  static getAllRecords(params = {}) {
    try {
      const db = getDb();
      const { page = 1, pageSize = 20, equipmentId } = params;
      
      let sql = `
        SELECT hr.*, e.name as equipment_name, e.equipment_code 
        FROM health_records hr
        LEFT JOIN equipment e ON e.id = hr.equipment_id
        WHERE 1=1
      `;
      const queryParams = [];
      
      if (equipmentId) {
        sql += ' AND hr.equipment_id = ?';
        queryParams.push(equipmentId);
      }
      
      const total = db.prepare(`SELECT COUNT(*) as count FROM (${sql})`).get(...queryParams).count;
      
      const offset = (page - 1) * pageSize;
      sql += ' ORDER BY hr.check_date DESC LIMIT ? OFFSET ?';
      queryParams.push(pageSize, offset);
      
      const list = db.prepare(sql).all(...queryParams).map(item => ({
        ...item,
        health_assessment: getHealthAssessment(item.health_score),
      }));
      
      return { list, total, page, pageSize };
    } catch (error) {
      captureError(error, { module: 'HealthService', method: 'getAllRecords' });
      throw error;
    }
  }

  static getEquipmentHealth(equipmentId) {
    try {
      const db = getDb();
      
      const equipment = db.prepare('SELECT * FROM equipment WHERE id = ?').get(equipmentId);
      if (!equipment) {
        return null;
      }

      const records = db.prepare(`
        SELECT * FROM health_records 
        WHERE equipment_id = ? 
        ORDER BY check_date DESC 
        LIMIT 30
      `).all(equipmentId);

      const avgScore = records.length > 0 
        ? Math.round(records.reduce((sum, r) => sum + r.health_score, 0) / records.length)
        : equipment.health_score;

      const trend = records.length >= 7 
        ? this.calculateTrend(records.slice(0, 7).map(r => r.health_score))
        : 'stable';

      const latestRecord = records[0] || null;

      const riskLevel = this.assessRiskLevel(equipment, records);

      const recommendations = this.generateRecommendations(equipment, records, riskLevel);

      return {
        equipment_id: equipmentId,
        equipment_name: equipment.name,
        equipment_code: equipment.equipment_code,
        current_score: equipment.health_score,
        current_assessment: getHealthAssessment(equipment.health_score),
        avg_score_30d: avgScore,
        trend,
        trend_text: this.getTrendText(trend),
        records,
        latest_record: latestRecord,
        risk_level: riskLevel,
        risk_level_text: this.getRiskLevelText(riskLevel),
        recommendations,
        prediction: this.predictFutureHealth(equipment, records),
      };
    } catch (error) {
      captureError(error, { module: 'HealthService', method: 'getEquipmentHealth', equipmentId });
      throw error;
    }
  }

  static addRecord(equipmentId, data) {
    try {
      const db = getDb();
      
      const equipment = db.prepare('SELECT * FROM equipment WHERE id = ?').get(equipmentId);
      if (!equipment) {
        throw new Error('设备不存在');
      }

      const healthScore = calculateHealthScore(data);
      const assessment = getHealthAssessment(healthScore);

      const result = db.prepare(`
        INSERT INTO health_records (equipment_id, running_hours, temperature, vibration,
          pressure, power_consumption, error_codes, health_score, assessment, recommendations)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        equipmentId,
        data.running_hours || 0,
        data.temperature || 0,
        data.vibration || 0,
        data.pressure || 0,
        data.power_consumption || 0,
        data.error_codes || '',
        healthScore,
        assessment.text + ' - ' + this.generateAssessmentText(healthScore, data),
        this.generateRecommendationsForRecord(healthScore, data)
      );

      db.prepare(`
        UPDATE equipment 
        SET health_score = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(healthScore, equipmentId);

      if (healthScore < 60) {
        db.prepare(`
          UPDATE equipment 
          SET status = 'maintenance', updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND status = 'running'
        `).run(equipmentId);
      }

      captureMessage(`Health record added for equipment: ${equipmentId}, score: ${healthScore}`, 'info', {
        module: 'HealthService',
        equipmentId,
        healthScore,
      });

      return {
        id: result.lastInsertRowid,
        health_score: healthScore,
        assessment: assessment,
      };
    } catch (error) {
      captureError(error, { module: 'HealthService', method: 'addRecord', equipmentId });
      throw error;
    }
  }

  static triggerHealthCheck(equipmentId) {
    try {
      addJob(config.queues.healthCheck, 'health-check', { equipmentId });
      
      captureMessage(`Health check triggered for equipment: ${equipmentId}`, 'info', {
        module: 'HealthService',
        equipmentId,
      });

      return { success: true, message: '健康检查已触发，结果稍后更新' };
    } catch (error) {
      captureError(error, { module: 'HealthService', method: 'triggerHealthCheck', equipmentId });
      throw error;
    }
  }

  static batchHealthCheck() {
    try {
      const db = getDb();
      const equipmentList = db.prepare(`
        SELECT id FROM equipment 
        WHERE status IN ('running', 'installed', 'maintenance')
      `).all();

      equipmentList.forEach(equip => {
        addJob(config.queues.healthCheck, 'health-check', { equipmentId: equip.id });
      });

      captureMessage(`Batch health check triggered for ${equipmentList.length} equipment`, 'info', {
        module: 'HealthService',
        count: equipmentList.length,
      });

      return { success: true, count: equipmentList.length, message: `已为 ${equipmentList.length} 台设备触发健康检查` };
    } catch (error) {
      captureError(error, { module: 'HealthService', method: 'batchHealthCheck' });
      throw error;
    }
  }

  static getHealthReport() {
    try {
      const db = getDb();
      
      const equipmentList = db.prepare(`
        SELECT e.*, 
          (SELECT health_score FROM health_records WHERE equipment_id = e.id ORDER BY check_date DESC LIMIT 1) as latest_score
        FROM equipment e
        WHERE e.status != 'scrapped'
      `).all();

      const healthDistribution = {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
        critical: 0,
      };

      let totalScore = 0;
      let scoredCount = 0;

      equipmentList.forEach(equip => {
        const score = equip.latest_score !== null ? equip.latest_score : equip.health_score;
        if (score !== null) {
          totalScore += score;
          scoredCount++;
          const assessment = getHealthAssessment(score);
          healthDistribution[assessment.level]++;
        }
      });

      const avgScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;

      const atRiskEquipment = equipmentList
        .filter(e => (e.latest_score !== null ? e.latest_score : e.health_score) < 60)
        .map(e => ({
          id: e.id,
          name: e.name,
          equipment_code: e.equipment_code,
          health_score: e.latest_score !== null ? e.latest_score : e.health_score,
          status: e.status,
          assessment: getHealthAssessment(e.latest_score !== null ? e.latest_score : e.health_score),
        }));

      const categoryHealth = db.prepare(`
        SELECT 
          e.category,
          COUNT(*) as total,
          AVG(e.health_score) as avg_score
        FROM equipment e
        WHERE e.status != 'scrapped'
        GROUP BY e.category
      `).all().map(c => ({
        ...c,
        avg_score: Math.round(c.avg_score || 0),
        assessment: getHealthAssessment(Math.round(c.avg_score || 0)),
      }));

      return {
        total_equipment: equipmentList.length,
        scored_equipment: scoredCount,
        average_health_score: avgScore,
        overall_assessment: getHealthAssessment(avgScore),
        health_distribution: healthDistribution,
        at_risk_equipment: atRiskEquipment,
        category_health: categoryHealth,
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      captureError(error, { module: 'HealthService', method: 'getHealthReport' });
      throw error;
    }
  }

  static calculateTrend(scores) {
    if (scores.length < 2) return 'stable';
    
    const recent = scores.slice(0, 3);
    const older = scores.slice(-3);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    
    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  }

  static getTrendText(trend) {
    const trendMap = {
      improving: '上升',
      stable: '稳定',
      declining: '下降',
    };
    return trendMap[trend] || '未知';
  }

  static assessRiskLevel(equipment, records) {
    const score = equipment.health_score;
    const recentRecords = records.slice(0, 7);
    
    if (score < 40) return 'critical';
    if (score < 60) return 'high';
    
    if (recentRecords.length >= 3) {
      const recentScores = recentRecords.map(r => r.health_score);
      const trend = this.calculateTrend(recentScores);
      if (trend === 'declining' && score < 75) return 'medium';
    }
    
    if (score < 75) return 'low';
    return 'none';
  }

  static getRiskLevelText(level) {
    const levelMap = {
      critical: '严重风险',
      high: '高风险',
      medium: '中等风险',
      low: '低风险',
      none: '无风险',
    };
    return levelMap[level] || '未知';
  }

  static generateRecommendations(equipment, records, riskLevel) {
    const recommendations = [];
    const score = equipment.health_score;

    if (score < 60) {
      recommendations.push('立即停机检修，排查关键故障');
      recommendations.push('安排专业技术人员进行全面检测');
      recommendations.push('考虑启动应急预案，启用备用设备');
    } else if (score < 75) {
      recommendations.push('增加日常点检频率，密切关注运行参数');
      recommendations.push('提前安排维保计划，检查关键部件');
      recommendations.push('准备必要的备件库存');
    } else if (score < 90) {
      recommendations.push('按计划进行日常维护保养');
      recommendations.push('定期检查运行参数变化趋势');
    } else {
      recommendations.push('继续保持良好的维护保养习惯');
      recommendations.push('按既定周期进行例行检查');
    }

    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('建议制定专项维护方案');
    }

    return recommendations;
  }

  static generateRecommendationsForRecord(score, data) {
    const recommendations = [];

    if (data.temperature > 60) {
      recommendations.push('检查冷却系统，清理散热片');
    }
    if (data.vibration > 3) {
      recommendations.push('检查轴承和传动部件，考虑动平衡校准');
    }
    if (data.pressure > 0.8) {
      recommendations.push('检查压力系统，排查泄漏点');
    }
    if (data.power_consumption > 40) {
      recommendations.push('检查电气系统，排查异常功耗原因');
    }
    if (data.error_codes) {
      recommendations.push(`处理故障代码: ${data.error_codes}`);
    }

    if (recommendations.length === 0) {
      recommendations.push('设备运行正常，继续保持');
    }

    return recommendations.join('；');
  }

  static generateAssessmentText(score, data) {
    const assessment = getHealthAssessment(score).text;
    
    const issues = [];
    if (data.temperature > 60) issues.push('温度偏高');
    if (data.vibration > 3) issues.push('振动超标');
    if (data.pressure > 0.8) issues.push('压力异常');
    if (data.error_codes) issues.push('存在故障代码');
    
    if (issues.length > 0) {
      return `${assessment}，存在以下问题：${issues.join('、')}`;
    }
    
    return `${assessment}，各项运行参数正常`;
  }

  static predictFutureHealth(equipment, records) {
    if (records.length < 7) {
      return {
        prediction_7d: null,
        prediction_30d: null,
        confidence: 'low',
        note: '数据不足，无法进行准确预测',
      };
    }

    const scores = records.slice(0, 14).map(r => r.health_score);
    const trend = this.calculateTrend(scores);
    
    const currentScore = equipment.health_score;
    const avgChange = scores.length >= 2 
      ? (scores[0] - scores[scores.length - 1]) / Math.min(scores.length - 1, 7)
      : 0;

    let prediction7d = currentScore + avgChange * 7;
    let prediction30d = currentScore + avgChange * 30;

    prediction7d = Math.max(0, Math.min(100, Math.round(prediction7d)));
    prediction30d = Math.max(0, Math.min(100, Math.round(prediction30d)));

    let confidence = 'medium';
    if (Math.abs(avgChange) < 1) confidence = 'high';
    if (Math.abs(avgChange) > 5) confidence = 'low';

    let note = '';
    if (trend === 'declining') {
      note = '健康度呈下降趋势，建议加强维护';
    } else if (trend === 'improving') {
      note = '健康度呈上升趋势，维护效果良好';
    } else {
      note = '健康度稳定，继续保持';
    }

    return {
      prediction_7d: prediction7d,
      prediction_30d: prediction30d,
      prediction_7d_assessment: getHealthAssessment(prediction7d),
      prediction_30d_assessment: getHealthAssessment(prediction30d),
      trend,
      average_daily_change: Math.round(avgChange * 10) / 10,
      confidence,
      note,
    };
  }
}

module.exports = HealthService;
