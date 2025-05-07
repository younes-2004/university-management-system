package com.universite.admin.service;

import com.universite.academic.entity.Filiere;
import com.universite.academic.repository.FiliereRepository;
import com.universite.auth.dto.UserDto;
import com.universite.auth.entity.enums.StudentStatus;
import com.universite.auth.entity.enums.StudentYear;
import com.universite.auth.entity.enums.UserRole;
import com.universite.auth.exception.BadRequestException;
import com.universite.auth.exception.ResourceNotFoundException;
import com.universite.auth.service.UserService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ExcelImportService {

    private final UserService userService;
    private final FiliereRepository filiereRepository;

    @Transactional
    public List<UserDto> importStudentsFromExcel(MultipartFile file, Long filiereId) {
        if (file.isEmpty()) {
            throw new BadRequestException("Le fichier est vide");
        }

        if (!isExcelFile(file)) {
            throw new BadRequestException("Format de fichier non supporté. Veuillez utiliser un fichier Excel (.xlsx)");
        }

        // Vérifier juste que la filière existe, sans stocker la variable
        filiereRepository.findById(filiereId)
                .orElseThrow(() -> new ResourceNotFoundException("Filière non trouvée avec l'id : " + filiereId));

        List<UserDto> importedStudents = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);

            // Ignorer la première ligne (en-têtes)
            Iterator<Row> rows = sheet.iterator();
            if (rows.hasNext()) {
                rows.next(); // Skip header row
            }

            // Extraction du traitement des lignes dans une méthode séparée
            importedStudents = processExcelRows(rows, filiereId);

            return importedStudents;

        } catch (IOException e) {
            throw new BadRequestException("Erreur lors de la lecture du fichier Excel: " + e.getMessage());
        }
    }

    // Nouvelle méthode extraite pour traiter les lignes Excel
    private List<UserDto> processExcelRows(Iterator<Row> rows, Long filiereId) {
        List<UserDto> importedStudents = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int rowNumber = 1;

        while (rows.hasNext()) {
            rowNumber++;
            Row currentRow = rows.next();

            try {
                UserDto student = extractStudentFromRow(currentRow, filiereId);
                // Utiliser un mot de passe temporaire (par exemple, le numéro Apogée)
                UserDto savedStudent = userService.createUser(student, student.getNApogee());
                importedStudents.add(savedStudent);
            } catch (Exception e) {
                errors.add("Erreur à la ligne " + rowNumber + ": " + e.getMessage());
            }
        }

        if (!errors.isEmpty()) {
            throw new BadRequestException("Erreurs lors de l'importation: " + String.join("; ", errors));
        }

        return importedStudents;
    }

    private boolean isExcelFile(MultipartFile file) {
        String filename = file.getOriginalFilename();
        return filename != null && (filename.endsWith(".xlsx") || filename.endsWith(".xls"));
    }

    private UserDto extractStudentFromRow(Row row, Long filiereId) {
        // Colonnes attendues:
        // 0: Numéro Apogée
        // 1: Nom
        // 2: Prénom
        // 3: Email
        // 4: Date de naissance (au format dd/MM/yyyy)
        // 5: Année (1 ou 2)

        String nApogee = getStringCellValue(row.getCell(0));
        String nom = getStringCellValue(row.getCell(1));
        String prenom = getStringCellValue(row.getCell(2));
        String email = getStringCellValue(row.getCell(3));
        LocalDate dateNaissance = getDateCellValue(row.getCell(4));
        int anneeValue = (int) getNumericCellValue(row.getCell(5));

        // Validation
        if (nApogee == null || nApogee.trim().isEmpty()) {
            throw new BadRequestException("Numéro Apogée manquant");
        }
        if (nom == null || nom.trim().isEmpty()) {
            throw new BadRequestException("Nom manquant");
        }
        if (prenom == null || prenom.trim().isEmpty()) {
            throw new BadRequestException("Prénom manquant");
        }
        if (email == null || email.trim().isEmpty()) {
            throw new BadRequestException("Email manquant");
        }
        if (dateNaissance == null) {
            throw new BadRequestException("Date de naissance manquante ou format invalide");
        }
        if (anneeValue != 1 && anneeValue != 2) {
            throw new BadRequestException("Année invalide (doit être 1 ou 2)");
        }

        StudentYear annee = (anneeValue == 1) ? StudentYear.PREMIERE_ANNEE : StudentYear.DEUXIEME_ANNEE;

        return UserDto.builder()
                .nApogee(nApogee)
                .nom(nom)
                .prenom(prenom)
                .email(email)
                .dateNaissance(dateNaissance)
                .role(UserRole.STUDENT)
                .statut(StudentStatus.ACTIF)
                .annee(annee)
                .filiereId(filiereId)
                .build();
    }

    private String getStringCellValue(Cell cell) {
        // Reste du code inchangé
        if (cell == null) {
            return null;
        }

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                return String.valueOf((int) cell.getNumericCellValue());
            default:
                return null;
        }
    }

    private double getNumericCellValue(Cell cell) {
        // Reste du code inchangé
        if (cell == null) {
            throw new BadRequestException("Cellule numérique manquante");
        }

        if (cell.getCellType() == CellType.NUMERIC) {
            return cell.getNumericCellValue();
        } else if (cell.getCellType() == CellType.STRING) {
            try {
                return Double.parseDouble(cell.getStringCellValue());
            } catch (NumberFormatException e) {
                throw new BadRequestException("Valeur numérique invalide: " + cell.getStringCellValue());
            }
        }

        throw new BadRequestException("Type de cellule incorrect pour une valeur numérique");
    }

    private LocalDate getDateCellValue(Cell cell) {
        // Reste du code inchangé
        if (cell == null) {
            return null;
        }

        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            Date date = cell.getDateCellValue();
            return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        } else if (cell.getCellType() == CellType.STRING) {
            String dateStr = cell.getStringCellValue();
            // Format attendu: dd/MM/yyyy
            String[] parts = dateStr.split("/");
            if (parts.length == 3) {
                try {
                    int day = Integer.parseInt(parts[0]);
                    int month = Integer.parseInt(parts[1]);
                    int year = Integer.parseInt(parts[2]);
                    return LocalDate.of(year, month, day);
                } catch (NumberFormatException | java.time.DateTimeException e) {
                    throw new BadRequestException("Format de date invalide: " + dateStr);
                }
            }
        }

        return null;
    }
}