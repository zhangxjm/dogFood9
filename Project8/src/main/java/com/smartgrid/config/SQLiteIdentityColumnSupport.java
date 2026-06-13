package com.smartgrid.config;

import org.hibernate.MappingException;
import org.hibernate.dialect.identity.IdentityColumnSupportImpl;

public class SQLiteIdentityColumnSupport extends IdentityColumnSupportImpl {

    @Override
    public boolean supportsIdentityColumns() {
        return true;
    }

    @Override
    public boolean hasDataTypeInIdentityColumn() {
        return false;
    }

    @Override
    public String getIdentityColumnString(int type) throws MappingException {
        return "integer";
    }

    @Override
    public String getIdentitySelectString(String table, String column, int type) throws MappingException {
        return "select last_insert_rowid()";
    }

    @Override
    public boolean supportsInsertSelectIdentity() {
        return true;
    }

    @Override
    public String appendIdentitySelectToInsert(String insertString) {
        return insertString + "; select last_insert_rowid()";
    }
}
