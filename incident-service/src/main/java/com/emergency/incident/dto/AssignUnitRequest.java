package com.emergency.incident.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignUnitRequest {

    @NotNull(message = "Unit ID is required")
    private Long unitId;
}
