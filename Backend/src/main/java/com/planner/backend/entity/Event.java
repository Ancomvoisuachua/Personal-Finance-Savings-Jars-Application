package com.planner.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "events")
public class Event {

    @Id
    private String id;
    
    private String title;
    private String start;

    @Column(name = "event_end") // Bổ sung annotation này để tanh trug từ koa SQL "end"
    private String end;

    private String category;
    private String description;
    private String backgroundColor;
    private String borderColor;

    public Event() {
    }

    public Event(String id, String title, String start, String end, String category, String description, String backgroundColor, String borderColor) {
        this.id = id;
        this.title = title;
        this.start = start;
        this.end = end;
        this.category = category;
        this.description = description;
        this.backgroundColor = backgroundColor;
        this.borderColor = borderColor;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getStart() {
        return start;
    }

    public void setStart(String start) {
        this.start = start;
    }

    public String getEnd() {
        return end;
    }

    public void setEnd(String end) {
        this.end = end;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getBackgroundColor() {
        return backgroundColor;
    }

    public void setBackgroundColor(String backgroundColor) {
        this.backgroundColor = backgroundColor;
    }

    public String getBorderColor() {
        return borderColor;
    }

    public void setBorderColor(String borderColor) {
        this.borderColor = borderColor;
    }
}