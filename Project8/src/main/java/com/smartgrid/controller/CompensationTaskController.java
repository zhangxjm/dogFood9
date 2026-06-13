package com.smartgrid.controller;

import com.smartgrid.entity.ReactiveCompensationTask;
import com.smartgrid.repository.ReactiveCompensationTaskRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/compensation")
@Slf4j
public class CompensationTaskController {

    private final ReactiveCompensationTaskRepository reactiveCompensationTaskRepository;

    public CompensationTaskController(ReactiveCompensationTaskRepository reactiveCompensationTaskRepository) {
        this.reactiveCompensationTaskRepository = reactiveCompensationTaskRepository;
    }

    @GetMapping
    public List<ReactiveCompensationTask> listAll() {
        return reactiveCompensationTaskRepository.findAll();
    }

    @GetMapping("/status/{status}")
    public List<ReactiveCompensationTask> getByStatus(@PathVariable String status) {
        return reactiveCompensationTaskRepository.findByStatusOrderByCreatedAtDesc(status);
    }
}
