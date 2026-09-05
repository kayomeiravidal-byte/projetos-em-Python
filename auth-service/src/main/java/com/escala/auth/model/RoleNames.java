package com.escala.auth.model;

import java.util.List;

public final class RoleNames {

    public static final String ADMIN = "ADMIN";
    public static final String SUPERVISOR = "SUPERVISOR";
    public static final String LIDER = "LIDER";
    public static final String FUNCIONARIO = "FUNCIONARIO";

    private static final List<String> HIERARCHY = List.of(ADMIN, SUPERVISOR, LIDER, FUNCIONARIO);

    private RoleNames() {
    }

    public static int rank(String roleName) {
        int index = HIERARCHY.indexOf(roleName);
        if (index < 0) {
            throw new IllegalArgumentException("Papel desconhecido: " + roleName);
        }
        return index;
    }

    public static boolean isStrictlyBelow(String candidateRole, String referenceRole) {
        return rank(candidateRole) > rank(referenceRole);
    }
}
