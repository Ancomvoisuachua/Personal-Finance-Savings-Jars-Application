package com.finance.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long categoryId; // ID của danh mục
    private Double amount;   // Số tiền
    private String type;     // 'expense' hoặc 'income'
    private String date;     // Ngày giao dịch (YYYY-MM-DD)
    private String note;     // Ghi chú
}