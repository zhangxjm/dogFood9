const MaintenanceService = require('../services/maintenanceService');
const { successResponse, errorResponse } = require('../utils/helpers');

class MaintenanceController {
  static async getAllPlans(request, reply) {
    try {
      const result = MaintenanceService.getAllPlans(request.query);
      return reply.send(successResponse(result, '获取维保计划列表成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('获取维保计划列表失败', 500, error.message));
    }
  }

  static async getPlanById(request, reply) {
    try {
      const result = MaintenanceService.getPlanById(request.params.id);
      if (!result) {
        return reply.code(404).send(errorResponse('维保计划不存在', 404));
      }
      return reply.send(successResponse(result, '获取维保计划详情成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('获取维保计划详情失败', 500, error.message));
    }
  }

  static async createPlan(request, reply) {
    try {
      const result = MaintenanceService.createPlan(request.body);
      return reply.code(201).send(successResponse(result, '维保计划创建成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('创建维保计划失败', 500, error.message));
    }
  }

  static async updatePlan(request, reply) {
    try {
      const result = MaintenanceService.updatePlan(request.params.id, request.body);
      return reply.send(successResponse(result, '维保计划更新成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('更新维保计划失败', 500, error.message));
    }
  }

  static async deletePlan(request, reply) {
    try {
      MaintenanceService.deletePlan(request.params.id);
      return reply.send(successResponse(null, '维保计划删除成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('删除维保计划失败', 500, error.message));
    }
  }

  static async triggerMaintenance(request, reply) {
    try {
      const result = MaintenanceService.triggerMaintenance(request.params.id);
      return reply.send(successResponse(result, '维保已触发'));
    } catch (error) {
      return reply.code(500).send(errorResponse('触发维保失败', 500, error.message));
    }
  }

  static async generateAutoPlans(request, reply) {
    try {
      const result = MaintenanceService.generateAutoPlans();
      return reply.send(successResponse(result, `自动生成了 ${result.created} 条维保计划`));
    } catch (error) {
      return reply.code(500).send(errorResponse('自动生成维保计划失败', 500, error.message));
    }
  }
}

module.exports = MaintenanceController;
