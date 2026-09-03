package com.escala.auth.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PasswordHasherTest {

    private final PasswordHasher hasher = new PasswordHasher();

    @Test
    void hashAndVerifyRoundtrip() {
        String encoded = hasher.hash("senha-super-secreta");
        assertThat(hasher.matches("senha-super-secreta", encoded)).isTrue();
    }

    @Test
    void wrongPasswordFails() {
        String encoded = hasher.hash("senha-correta");
        assertThat(hasher.matches("senha-errada", encoded)).isFalse();
    }

    @Test
    void hashesAreSaltedDifferently() {
        String first = hasher.hash("mesma-senha");
        String second = hasher.hash("mesma-senha");
        assertThat(first).isNotEqualTo(second);
    }
}
