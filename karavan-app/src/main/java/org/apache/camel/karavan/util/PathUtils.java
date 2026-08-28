/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.apache.camel.karavan.util;

import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.util.regex.Pattern;

/**
 * Validation helpers for user supplied names (project ids and file names) that end up
 * as path segments on the file system.
 */
public final class PathUtils {

    private static final Pattern SAFE_NAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_\\-.]+$");

    private PathUtils() {
    }

    /**
     * Checks that a single path segment (file name or project id) is safe to use on the file system.
     *
     * @throws IllegalArgumentException if the name is empty or may escape its parent directory
     */
    public static void validateName(String kind, String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException(kind + " cannot be empty");
        }
        if (name.contains("..") || name.contains("/") || name.contains("\\") || name.indexOf('\0') >= 0) {
            throw new IllegalArgumentException(kind + " contains path traversal characters: " + name);
        }
        if (!SAFE_NAME_PATTERN.matcher(name).matches()) {
            throw new IllegalArgumentException(kind + " contains invalid characters: " + name);
        }
    }

    public static void validateFileName(String fileName) {
        validateName("Filename", fileName);
    }

    public static void validateProjectId(String projectId) {
        validateName("Project id", projectId);
    }

    /**
     * Resolves a name against a base directory and guarantees that the result stays inside it.
     *
     * @throws SecurityException if the resolved path escapes the base directory
     */
    public static Path resolveInside(Path baseDir, String name) {
        Path base = baseDir.toAbsolutePath().normalize();
        Path target;
        try {
            target = base.resolve(name).toAbsolutePath().normalize();
        } catch (InvalidPathException e) {
            throw new SecurityException("Invalid path: " + name, e);
        }
        if (!target.startsWith(base) || target.equals(base)) {
            throw new SecurityException("Path traversal detected in: " + name);
        }
        return target;
    }
}
