package com.escala.auth.security;

import com.escala.auth.config.AppProperties;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

@Component
public class JwtCodec {

    private static final String ALGORITHM = "HmacSHA256";
    private static final JsonMapper JSON = JsonMapper.builder().build();
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();
    private static final Map<String, Object> HEADER = Map.of("alg", "HS256", "typ", "JWT");

    private final byte[] secretKey;

    public JwtCodec(AppProperties properties) {
        this.secretKey = properties.jwt().secret().getBytes(StandardCharsets.UTF_8);
        if (this.secretKey.length < 32) {
            throw new IllegalStateException(
                    "app.jwt.secret precisa ter pelo menos 32 bytes para HMAC-SHA256 seguro.");
        }
    }

    public String encode(Map<String, Object> claims) {
        String headerSegment = ENCODER.encodeToString(JSON.writeValueAsBytes(HEADER));
        String payloadSegment = ENCODER.encodeToString(JSON.writeValueAsBytes(claims));
        String signingInput = headerSegment + "." + payloadSegment;
        String signature = ENCODER.encodeToString(sign(signingInput));
        return signingInput + "." + signature;
    }

    public Map<String, Object> decodeAndVerify(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new JwtException("Token com formato inválido.");
        }

        String signingInput = parts[0] + "." + parts[1];
        byte[] expectedSignature = sign(signingInput);
        byte[] actualSignature;
        try {
            actualSignature = DECODER.decode(parts[2]);
        } catch (IllegalArgumentException e) {
            throw new JwtException("Assinatura do token inválida.");
        }
        if (!MessageDigest.isEqual(expectedSignature, actualSignature)) {
            throw new JwtException("Assinatura do token inválida.");
        }

        Map<String, Object> claims;
        try {
            claims = JSON.readValue(DECODER.decode(parts[1]), Map.class);
        } catch (Exception e) {
            throw new JwtException("Payload do token inválido.");
        }

        Object exp = claims.get("exp");
        if (exp == null || Instant.ofEpochSecond(((Number) exp).longValue()).isBefore(Instant.now())) {
            throw new JwtException("Token expirado.");
        }
        return claims;
    }

    private byte[] sign(String data) {
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            mac.init(new SecretKeySpec(secretKey, ALGORITHM));
            return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("Falha ao assinar token JWT", e);
        }
    }
}
