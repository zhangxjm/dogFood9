package com.bonded.common.util;

import org.springframework.jdbc.core.JdbcTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.io.File;
import java.sql.Connection;
import java.sql.Statement;

public class SqliteUtil {
    private static final Logger log = LoggerFactory.getLogger(SqliteUtil.class);

    public static void ensureDatabase(String dbPath) {
        File dbFile = new File(dbPath);
        File parentDir = dbFile.getParentFile();
        if (parentDir != null && !parentDir.exists()) {
            parentDir.mkdirs();
        }
    }

    public static void initSchema(DataSource dataSource, String... sqlFiles) {
        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
        for (String sql : sqlFiles) {
            if (sql != null && !sql.trim().isEmpty()) {
                try {
                    jdbcTemplate.execute(sql);
                } catch (Exception e) {
                    log.warn("SQL execution warning: {}", e.getMessage());
                }
            }
        }
    }

    public static void executeScript(DataSource dataSource, String script) {
        String[] statements = script.split(";");
        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
        for (String sql : statements) {
            sql = sql.trim();
            if (!sql.isEmpty()) {
                try {
                    jdbcTemplate.execute(sql);
                } catch (Exception e) {
                    log.warn("Script execution warning: {}", e.getMessage());
                }
            }
        }
    }
}
