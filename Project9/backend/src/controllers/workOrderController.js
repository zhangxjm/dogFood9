const WorkOrderService = require('../services/workOrderService');
const { successResponse, errorResponse } = require('../utils/helpers');

class WorkOrderController {
  static async getAll(request, reply) {
    try {
      const result = WorkOrderService.getAll(request.query);
      return reply.send(successResponse(result, '获取工单列表成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('获取工单列表失败', 500, error.message));
    }
  }

  static async getById(request, reply) {
    try {
      const result = WorkOrderService.getById(request.params.id);
      if (!result) {
        return reply.code(404).send(errorResponse('工单不存在', 404));
      }
      return reply.send(successResponse(result, '获取工单详情成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('获取工单详情失败', 500, error.message));
    }
  }

  static async create(request, reply) {
    try {
      const result = WorkOrderService.create(request.body);
      return reply.code(201).send(successResponse(result, '工单创建成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('创建工单失败', 500, error.message));
    }
  }

  static async update(request, reply) {
    try {
      const result = WorkOrderService.update(request.params.id, request.body);
      return reply.send(successResponse(result, '工单更新成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('更新工单失败', 500, error.message));
    }
  }

  static async startWork(request, reply) {
    try {
      const result = WorkOrderService.startWork(request.params.id, request.body.operator);
      return reply.send(successResponse(result, '工单已开始处理'));
    } catch (error) {
      return reply.code(500).send(errorResponse('开始处理工单失败', 500, error.message));
    }
  }

  static async complete(request, reply) {
    try {
      const result = WorkOrderService.complete(request.params.id, request.body);
      return reply.send(successResponse(result, '工单已完成'));
    } catch (error) {
      return reply.code(500).send(errorResponse('完成工单失败', 500, error.message));
    }
  }

  static async cancel(request, reply) {
    try {
      const result = WorkOrderService.cancel(request.params.id, request.body.reason);
      return reply.send(successResponse(result, '工单已取消'));
    } catch (error) {
      return reply.code(500).send(errorResponse('取消工单失败', 500, error.message));
    }
  }

  static async delete(request, reply) {
    try {
      WorkOrderService.delete(request.params.id);
      return reply.send(successResponse(null, '工单删除成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('删除工单失败', 500, error.message));
    }
  }

  static async getStats(request, reply) {
    try {
      const result = WorkOrderService.getStats();
      return reply.send(successResponse(result, '获取工单统计成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('获取工单统计失败', 500, error.message));
    }
  }
}

module.exports = WorkOrderController;
