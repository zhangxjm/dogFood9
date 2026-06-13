const HealthService = require('../services/healthService');
const { successResponse, errorResponse } = require('../utils/helpers');

class HealthController {
  static async getAllRecords(request, reply) {
    try {
      const result = HealthService.getAllRecords(request.query);
      return reply.send(successResponse(result, '获取健康记录成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('获取健康记录失败', 500, error.message));
    }
  }

  static async getEquipmentHealth(request, reply) {
    try {
      const result = HealthService.getEquipmentHealth(request.params.id);
      if (!result) {
        return reply.code(404).send(errorResponse('设备不存在', 404));
      }
      return reply.send(successResponse(result, '获取设备健康状态成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('获取设备健康状态失败', 500, error.message));
    }
  }

  static async addRecord(request, reply) {
    try {
      const result = HealthService.addRecord(request.params.id, request.body);
      return reply.code(201).send(successResponse(result, '健康记录添加成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('添加健康记录失败', 500, error.message));
    }
  }

  static async triggerHealthCheck(request, reply) {
    try {
      const result = HealthService.triggerHealthCheck(request.params.id);
      return reply.send(successResponse(result, '健康检查已触发'));
    } catch (error) {
      return reply.code(500).send(errorResponse('触发健康检查失败', 500, error.message));
    }
  }

  static async batchHealthCheck(request, reply) {
    try {
      const result = HealthService.batchHealthCheck();
      return reply.send(successResponse(result, result.message));
    } catch (error) {
      return reply.code(500).send(errorResponse('批量健康检查失败', 500, error.message));
    }
  }

  static async getHealthReport(request, reply) {
    try {
      const result = HealthService.getHealthReport();
      return reply.send(successResponse(result, '获取健康报告成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('获取健康报告失败', 500, error.message));
    }
  }
}

module.exports = HealthController;
