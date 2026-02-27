package org.apache.camel.karavan.cache;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

public class CacheUtils {

    public static <T> List<T> query(Map<?, T> cache, Predicate<T> predicate, Function<T, T> copier) {
        return cache.values().stream()
                .filter(predicate)
                .map(copier)
                .collect(Collectors.toList());
    }

    public static <T> T queryFirst(Map<?, T> cache, Predicate<T> predicate, Function<T, T> copier) {
        return cache.values().stream()
                .filter(predicate)
                .map(copier)
                .findFirst()
                .orElse(null);
    }
}