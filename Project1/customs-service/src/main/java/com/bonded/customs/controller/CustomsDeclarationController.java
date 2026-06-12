package com.bonded.customs.controller;

import com.bonded.common.result.Result;
import com.bonded.customs.entity.CustomsDeclaration;
import com.bonded.customs.service.CustomsDeclarationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/declaration")
public class CustomsDeclarationController {

    private final CustomsDeclarationService declarationService;

    public CustomsDeclarationController(CustomsDeclarationService declarationService) {
        this.declarationService = declarationService;
    }

    @GetMapping("/list")
    public Result<List<CustomsDeclaration>> list() {
        return Result.success(declarationService.list());
    }

    @GetMapping("/{id}")
    public Result<CustomsDeclaration> getById(@PathVariable Long id) {
        CustomsDeclaration declaration = declarationService.getById(id);
        if (declaration == null) {
            return Result.fail(404, "申报单不存在");
        }
        return Result.success(declaration);
    }

    @GetMapping("/order/{orderNo}")
    public Result<CustomsDeclaration> getByOrderNo(@PathVariable String orderNo) {
        CustomsDeclaration declaration = declarationService.getByOrderNo(orderNo);
        if (declaration == null) {
            return Result.fail(404, "申报单不存在");
        }
        return Result.success(declaration);
    }

    @PostMapping
    public Result<CustomsDeclaration> create(@RequestBody CustomsDeclaration declaration) {
        return Result.success(declarationService.create(declaration));
    }

    @PostMapping("/{id}/submit")
    public Result<CustomsDeclaration> submitForReview(@PathVariable Long id) {
        CustomsDeclaration declaration = declarationService.submitForReview(id);
        if (declaration == null) {
            return Result.fail(404, "申报单不存在");
        }
        return Result.success(declaration);
    }

    @PostMapping("/{id}/approve")
    public Result<CustomsDeclaration> approve(@PathVariable Long id) {
        CustomsDeclaration declaration = declarationService.approve(id);
        if (declaration == null) {
            return Result.fail(404, "申报单不存在");
        }
        return Result.success(declaration);
    }

    @PostMapping("/{id}/reject")
    public Result<CustomsDeclaration> reject(@PathVariable Long id, @RequestParam String reason) {
        CustomsDeclaration declaration = declarationService.reject(id, reason);
        if (declaration == null) {
            return Result.fail(404, "申报单不存在");
        }
        return Result.success(declaration);
    }

    @GetMapping("/status/{status}")
    public Result<List<CustomsDeclaration>> listByStatus(@PathVariable String status) {
        return Result.success(declarationService.listByStatus(status));
    }
}
