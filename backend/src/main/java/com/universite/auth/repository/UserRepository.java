package com.universite.auth.repository;

import com.universite.auth.entity.User;
import com.universite.auth.entity.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsBynApogee(String nApogee);

    List<User> findByRole(UserRole role);
    Optional<User> findBynApogee(String nApogee);
}