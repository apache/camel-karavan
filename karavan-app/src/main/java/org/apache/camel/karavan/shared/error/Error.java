package org.apache.camel.karavan.shared.error;

import java.util.Objects;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class Error {
    private String field;
    private String message;
    private String code;

    public Error(String message) {
        this.message = message;
    }

    public Error(String field, String message) {
        this.field = field;
        this.message = message;
    }

    public Error(String field, String message, String code) {
        this.field = field;
        this.message = message;
        this.code = code;
    }

    public String getField() {
        return field;
    }

    public void setField(String field) {
        this.field = field;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        Error error = (Error) o;
        return Objects.equals(field, error.field) && Objects.equals(message, error.message)
                && Objects.equals(code, error.code);
    }

    @Override
    public int hashCode() {
        return Objects.hash(field, message, code);
    }

    @Override
    public String toString() {
        return "Error{" +
                "field='" + field + '\'' +
                ", message='" + message + '\'' +
                ", code='" + code + '\'' +
                '}';
    }
}