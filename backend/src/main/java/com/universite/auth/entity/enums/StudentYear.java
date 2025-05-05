package com.universite.auth.entity.enums;

public enum StudentYear {
    PREMIERE_ANNEE("1ère année"),
    DEUXIEME_ANNEE("2ème année");

    private final String displayName;

    StudentYear(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}