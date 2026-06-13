const EquipmentService = require('../services/equipmentService');
const { successResponse, errorResponse } = require('../utils/helpers');

class EquipmentController {
  static async getAll(request, reply) {
    try {
      const result = EquipmentService.getAll(request.query);
      return reply.send(successResponse(result, '获取设备列表成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('获取设备列表失败', 500, error.message));
    }
  }

  static async getById(request, reply) {
    try {
      const result = EquipmentService.getById(request.params.id);
      if (!result) {
        return reply.code(404).send(errorResponse('设备不存在', 404));
      }
      return reply.send(successResponse(result, '获取设备详情成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('获取设备详情失败', 500, error.message));
    }
  }

  static async create(request, reply) {
    try {
      const result = EquipmentService.create(request.body);
      return reply.code(201).send(successResponse(result, '设备创建成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('创建设备失败', 500, error.message));
    }
  }

  static async update(request, reply) {
    try {
      const result = EquipmentService.update(request.params.id, request.body);
      return reply.send(successResponse(result, '设备更新成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('更新设备失败', 500, error.message));
    }
  }

  static async install(request, reply) {
    try {
      const result = EquipmentService.install(request.params.id, request.body);
      return reply.send(successResponse(result, '设备安装成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('设备安装失败', 500, error.message));
    }
  }

  static async startOperation(request, reply) {
    try {
      const result = EquipmentService.startOperation(request.params.id, request.body.operator);
      return reply.send(successResponse(result, '设备已投入运行'));
    } catch (error) {
      return reply.code(500).send(errorResponse('设备启动失败', 500, error.message));
    }
  }

  static async scrap(request, reply) {
    try {
      const result = EquipmentService.scrap(request.params.id, request.body);
      return reply.send(successResponse(result, '设备已报废'));
    } catch (error) {
      return reply.code(500).send(errorResponse('设备报废失败', 500, error.message));
    }
  }

  static async delete(request, reply) {
    try {
      EquipmentService.delete(request.params.id);
      return reply.send(successResponse(null, '设备删除成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('删除设备失败', 500, error.message));
    }
  }

  static async getStats(request, reply) {
    try {
      const result = EquipmentService.getStats();
      return reply.send(successResponse(result, '获取设备统计成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('获取设备统计失败', 500, error.message));
    }
  }
}

module.exports = EquipmentController;
