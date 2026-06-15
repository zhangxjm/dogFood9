package com.exam.dto;

import lombok.Data;

@Data
public class RegisterDTO {

    private String username;

    private String password;

    private String realName;

    private Integer role;

    private String email;

    private String phone;
}
