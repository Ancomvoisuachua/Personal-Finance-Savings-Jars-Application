package com.finance.backend.repository;

import com.finance.backend.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    // Tìm các giao dịch theo loại (expense / income)
    List<Transaction> findByType(String type);
}