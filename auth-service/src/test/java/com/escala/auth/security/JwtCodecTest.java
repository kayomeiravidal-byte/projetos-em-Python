package com.escala.auth.security;

import com.escala.auth.config.AppProperties;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtCodecTest {

    private final AppProperties properties = new AppProperties(
            new AppProperties.Jwt("test-secret-key-with-at-least-32-bytes!!", 15, 7),
            new AppProperties.Cors(List.of("http://localhost:5173"))
    );

    private final JwtCodec codec = new JwtCodec(properties);

    @Test
    void encodeAndDecodeRoundtrip() {
        Map<String, Object> claims = Map.of(
                "sub", 1,
                "orgId", 10,
                "email", "admin@example.com",
                "role", "ADMIN",
                "permissions", List.of("users:manage"),
                "exp", Instant.now().plusSeconds(60).getEpochSecond()
        );

        String token = codec.encode(claims);
        Map<String, Object> decoded = codec.decodeAndVerify(token);

        assertThat(decoded.get("email")).isEqualTo("admin@example.com");
        assertThat(decoded.get("role")).isEqualTo("ADMIN");
    }

    @Test
    void tamperedSignatureIsRejected() {
        Map<String, Object> claims = Map.of(
                "sub", 1, "exp", Instant.now().plusSeconds(60).getEpochSecond()
        );
        String token = codec.encode(claims);
        String tampered = token.substring(0, token.length() - 2) + "xx";

        assertThatThrownBy(() -> codec.decodeAndVerify(tampered))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void expiredTokenIsRejected() {
        Map<String, Object> claims = Map.of(
                "sub", 1, "exp", Instant.now().minusSeconds(60).getEpochSecond()
        );
        String token = codec.encode(claims);

        assertThatThrownBy(() -> codec.decodeAndVerify(token))
                .isInstanceOf(JwtException.class);
    }
}
