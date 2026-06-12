package com.bonded.customs.controller;

import com.bonded.common.result.Result;
import com.bonded.customs.entity.ThreeDocument;
import com.bonded.customs.service.ThreeDocumentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/document")
public class ThreeDocumentController {

    private final ThreeDocumentService documentService;

    public ThreeDocumentController(ThreeDocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping("/list")
    public Result<List<ThreeDocument>> list() {
        return Result.success(documentService.list());
    }

    @GetMapping("/order/{orderId}")
    public Result<ThreeDocument> getByOrderId(@PathVariable Long orderId) {
        ThreeDocument doc = documentService.getByOrderId(orderId);
        if (doc == null) {
            return Result.fail(404, "三单数据不存在");
        }
        return Result.success(doc);
    }

    @PostMapping
    public Result<ThreeDocument> create(@RequestBody ThreeDocument document) {
        return Result.success(documentService.create(document));
    }

    @PostMapping("/compare/{orderId}")
    public Result<ThreeDocument> compareDocuments(@PathVariable Long orderId) {
        ThreeDocument doc = documentService.compareDocuments(orderId);
        if (doc == null) {
            return Result.fail(404, "三单数据不存在");
        }
        return Result.success(doc);
    }
}
