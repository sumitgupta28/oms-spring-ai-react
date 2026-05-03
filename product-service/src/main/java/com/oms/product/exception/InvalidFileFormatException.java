package com.oms.product.exception;

public class InvalidFileFormatException extends RuntimeException {
    public InvalidFileFormatException(String message, Throwable cause) {
        super(message, cause);
    }
}
