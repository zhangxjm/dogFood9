package com.exam.dto;

import lombok.Data;

@Data
public class LoginDTO {

    private String username;

    private String password;

    private Integer role;
}
