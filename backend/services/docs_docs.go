package services

import (
	"fmt"

	"git.difuse.io/Difuse/kalmia/db/models"
	"git.difuse.io/Difuse/kalmia/logger"
	"git.difuse.io/Difuse/kalmia/utils"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

func (service *DocService) GetDocumentations() ([]models.Documentation, error) {
	var documentations []models.Documentation

	db := service.DB

	if err := db.Preload("Author", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Username", "Email", "Photo")
	}).Preload("Editors", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Username", "Email", "Photo")
	}).Preload("PageGroups", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "DocumentationID", "Name", "CreatedAt", "UpdatedAt", "AuthorID", "Order")
	}).Preload("PageGroups.Author", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Username", "Email", "Photo")
	}).Preload("PageGroups.Editors", func(db *gorm.DB) *gorm.DB {
		return db.Select("users.ID", "users.Username", "users.Email", "users.Photo")
	}).Preload("PageGroups.Pages", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "PageGroupID", "Title", "Slug", "CreatedAt", "UpdatedAt", "AuthorID", "Order")
	}).Preload("PageGroups.Pages.Author", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Username", "Email", "Photo")
	}).Preload("PageGroups.Pages.Editors", func(db *gorm.DB) *gorm.DB {
		return db.Select("users.ID", "users.Username", "users.Email", "users.Photo")
	}).Preload("Pages", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "DocumentationID", "Title", "Slug", "CreatedAt", "UpdatedAt", "AuthorID", "Order").Where("page_group_id IS NULL")
	}).Preload("Pages.Author", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Username", "Email", "Photo")
	}).Preload("Pages.Editors", func(db *gorm.DB) *gorm.DB {
		return db.Select("users.ID", "users.Username", "users.Email", "users.Photo")
	}).Select("ID", "Name", "Description", "CreatedAt", "UpdatedAt", "AuthorID", "Version", "ClonedFrom", "LastEditorID", "Favicon", "MetaImage", "NavImage", "CustomCSS", "FooterLabelLinks", "MoreLabelLinks").
		Find(&documentations).Error; err != nil {
		return nil, fmt.Errorf("failed_to_get_documentations")
	}

	return documentations, nil
}

func (service *DocService) GetDocumentation(id uint) (models.Documentation, error) {
	var documentation models.Documentation
	var count int64

	db := service.DB

	if err := db.Model(&models.Documentation{}).Where("id = ?", id).Count(&count).Error; err != nil {
		return models.Documentation{}, fmt.Errorf("documentation_not_found")
	}

	if count == 0 {
		return models.Documentation{}, fmt.Errorf("documentation_not_found")
	}

	if err := db.Preload("Author", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Username", "Email", "Photo")
	}).Preload("Editors", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Username", "Email", "Photo")
	}).Preload("PageGroups", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "DocumentationID", "Name", "CreatedAt", "UpdatedAt", "AuthorID")
	}).Preload("PageGroups.Author", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Username", "Email", "Photo")
	}).Preload("PageGroups.Editors", func(db *gorm.DB) *gorm.DB {
		return db.Select("users.ID", "users.Username", "users.Email", "users.Photo")
	}).Preload("PageGroups.Pages", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "PageGroupID", "Title", "Slug", "CreatedAt", "UpdatedAt", "AuthorID")
	}).Preload("PageGroups.Pages.Author", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Username", "Email", "Photo")
	}).Preload("PageGroups.Pages.Editors", func(db *gorm.DB) *gorm.DB {
		return db.Select("users.ID", "users.Username", "users.Email", "users.Photo")
	}).Preload("Pages", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "DocumentationID", "Title", "Slug", "CreatedAt", "UpdatedAt", "AuthorID").Where("page_group_id IS NULL")
	}).Preload("Pages.Author", func(db *gorm.DB) *gorm.DB {
		return db.Select("ID", "Username", "Email", "Photo")
	}).Preload("Pages.Editors", func(db *gorm.DB) *gorm.DB {
		return db.Select("users.ID", "users.Username", "users.Email", "users.Photo")
	}).Where("id = ?", id).Select("ID", "Name", "Description", "CreatedAt", "UpdatedAt", "AuthorID", "Version", "LastEditorID", "Favicon", "MetaImage", "NavImage", "CustomCSS", "FooterLabelLinks", "MoreLabelLinks", "CopyrightText").
		Find(&documentation).Error; err != nil {
		return models.Documentation{}, fmt.Errorf("failed_to_get_documentation")
	}

	return documentation, nil
}

func (service *DocService) GetChildrenOfDocumentation(id uint) ([]uint, error) {
	docs, err := service.GetDocumentations()

	if err != nil {
		return nil, err
	}

	var children []uint

	for _, doc := range docs {
		if doc.ClonedFrom != nil {
			if *doc.ClonedFrom == id {
				children = append(children, doc.ID)
			}
		}
	}

	return children, nil
}

func (service *DocService) CreateDocumentation(documentation *models.Documentation, user models.User) error {
	db := service.DB

	var count int64

	if err := db.Model(&models.Documentation{}).Where("name = ?", documentation.Name).Count(&count).Error; err != nil {
		return fmt.Errorf("failed_to_check_documentation_name")
	}

	if count > 0 {
		return fmt.Errorf("documentation_name_already_exists")
	}

	if err := db.Create(documentation).Error; err != nil {
		return fmt.Errorf("failed_to_create_documentation")
	}

	introPageContent := fmt.Sprintf(`[{"id":"fa01e096-3187-4628-8f1e-77728cee3aa6","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"Welcome to the %s documentation!","styles":{}}],"children":[]},{"id":"90f28c74-6195-4074-8861-35b82b9bfb1c","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]}]`, documentation.Name)

	introPage := models.Page{
		Title:           "Introduction",
		Slug:            "/",
		Content:         introPageContent,
		DocumentationID: documentation.ID,
		AuthorID:        user.ID,
		Author:          user,
		Editors:         []models.User{user},
		LastEditorID:    &user.ID,
		Order:           utils.UintPtr(0),
	}

	if err := db.Create(&introPage).Error; err != nil {
		return fmt.Errorf("failed_to_create_documentation_intro_page")
	}

	err := service.InitDocusaurus(documentation.ID)

	if err != nil {
		logger.Error("failed_to_init_docusaurus", zap.Error(err))
		db.Delete(&documentation)
		db.Delete(&introPage)

		return fmt.Errorf("failed_to_init_docusaurus")
	}

	return nil
}

func (service *DocService) EditDocumentation(user models.User, id uint, name, description, version, favicon, metaImage, navImage, customCSS, footerLabelLinks, moreLabelLinks, copyrightText string) error {
	tx := service.DB.Begin()

	updateDoc := func(doc *models.Documentation, isTarget bool) error {
		doc.LastEditorID = &user.ID
		doc.Name = name
		doc.Description = description
		doc.Favicon = favicon
		doc.MetaImage = metaImage
		doc.NavImage = navImage
		doc.CustomCSS = customCSS
		doc.FooterLabelLinks = footerLabelLinks
		doc.MoreLabelLinks = moreLabelLinks
		doc.CopyrightText = copyrightText

		if isTarget && version != "" {
			doc.Version = version
		}

		alreadyEditor := false
		for _, editor := range doc.Editors {
			if editor.ID == user.ID {
				alreadyEditor = true
				break
			}
		}
		if !alreadyEditor {
			doc.Editors = append(doc.Editors, user)
		}

		if err := tx.Save(doc).Error; err != nil {
			return fmt.Errorf("failed_to_update_documentation")
		}
		return nil
	}

	var targetDoc models.Documentation
	if err := tx.Preload("Editors").First(&targetDoc, id).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("documentation_not_found")
	}

	if err := updateDoc(&targetDoc, true); err != nil {
		tx.Rollback()
		return err
	}

	var relatedDocs []models.Documentation
	if err := tx.Preload("Editors").Where("id = ? OR cloned_from = ?", targetDoc.ClonedFrom, targetDoc.ID).Find(&relatedDocs).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed_to_fetch_related_documentations")
	}

	for i := range relatedDocs {
		if err := updateDoc(&relatedDocs[i], false); err != nil {
			tx.Rollback()
			return err
		}
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed_to_commit_changes")
	}

	return nil
}

func (service *DocService) DeleteDocumentation(id uint) error {
	tx := service.DB.Begin()
	if tx.Error != nil {
		return fmt.Errorf("failed_to_start_transaction")
	}

	var doc models.Documentation

	if err := tx.Preload("PageGroups").Preload("Pages").First(&doc, id).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("documentation_not_found")
	}

	associations := []string{"PageGroups", "Pages", "Editors"}
	for _, assoc := range associations {
		if err := tx.Model(&doc).Association(assoc).Clear(); err != nil {
			tx.Rollback()
			return fmt.Errorf("failed_to_clear_association")
		}
	}

	if err := tx.Delete(&doc).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed_to_delete_documentation")
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed_to_commit_changes")
	}

	return nil
}

func (service *DocService) CreateDocumentationVersion(originalDocId uint, newVersion string) error {
	var originalDoc models.Documentation
	if err := service.DB.Preload("PageGroups.Pages").Preload("Pages").First(&originalDoc, originalDocId).Error; err != nil {
		return fmt.Errorf("documentation_not_found")
	}

	ancestors, err := service.getAncestorDocuments(originalDoc.ID)
	if err != nil {
		return fmt.Errorf("failed to fetch ancestor documents: %w", err)
	}

	newDoc := models.Documentation{
		Name:             originalDoc.Name,
		Description:      originalDoc.Description,
		Version:          newVersion,
		ClonedFrom:       &originalDocId,
		Favicon:          originalDoc.Favicon,
		MetaImage:        originalDoc.MetaImage,
		NavImage:         originalDoc.NavImage,
		CustomCSS:        originalDoc.CustomCSS,
		FooterLabelLinks: originalDoc.FooterLabelLinks,
		MoreLabelLinks:   originalDoc.MoreLabelLinks,
		CopyrightText:    originalDoc.CopyrightText,
		AuthorID:         originalDoc.AuthorID,
		Author:           originalDoc.Author,
		Editors:          originalDoc.Editors,
		LastEditorID:     originalDoc.LastEditorID,
	}

	err = service.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&newDoc).Error; err != nil {
			return fmt.Errorf("failed_to_create_documentation")
		}

		for _, editor := range originalDoc.Editors {
			if err := tx.Model(&newDoc).Association("Editors").Append(&editor); err != nil {
				return fmt.Errorf("failed_to_add_editor")
			}
		}

		pageGroupMap := make(map[uint]uint)
		existingPageGroups := make(map[uint]bool)

		for _, pg := range originalDoc.PageGroups {
			existingPageGroups[pg.ID] = true
		}
		for _, ancestor := range ancestors {
			for _, pg := range ancestor.PageGroups {
				existingPageGroups[pg.ID] = true
			}
		}

		for _, pg := range originalDoc.PageGroups {
			newPG := models.PageGroup{
				DocumentationID: newDoc.ID,
				ParentID:        pg.ParentID,
				AuthorID:        pg.AuthorID,
				Name:            pg.Name,
				Order:           pg.Order,
			}
			if err := tx.Create(&newPG).Error; err != nil {
				return fmt.Errorf("failed_to_create_page_group")
			}
			pageGroupMap[pg.ID] = newPG.ID

			for _, editor := range pg.Editors {
				if err := tx.Model(&newPG).Association("Editors").Append(&editor); err != nil {
					return fmt.Errorf("failed_to_add_editor")
				}
			}

			for _, page := range pg.Pages {
				newPage := models.Page{
					DocumentationID: newDoc.ID,
					PageGroupID:     &newPG.ID,
					AuthorID:        page.AuthorID,
					Title:           page.Title,
					Slug:            page.Slug,
					Content:         page.Content,
					Order:           page.Order,
				}
				if err := tx.Create(&newPage).Error; err != nil {
					return fmt.Errorf("failed_to_create_page")
				}
				for _, editor := range page.Editors {
					if err := tx.Model(&newPage).Association("Editors").Append(&editor); err != nil {
						return fmt.Errorf("failed_to_add_editor")
					}
				}
			}
		}

		for oldID, newID := range pageGroupMap {
			var originalPageGroup *models.PageGroup
			for _, pg := range originalDoc.PageGroups {
				if pg.ID == oldID {
					originalPageGroup = &pg
					break
				}
			}
			if originalPageGroup == nil {
				for _, ancestor := range ancestors {
					for _, pg := range ancestor.PageGroups {
						if pg.ID == oldID {
							originalPageGroup = &pg
							break
						}
					}
					if originalPageGroup != nil {
						break
					}
				}
			}
			if originalPageGroup == nil {
				continue
			}
			if originalPageGroup.ParentID != nil {
				if !existingPageGroups[*originalPageGroup.ParentID] {
					if err := tx.Model(&models.PageGroup{}).Where("id = ?", newID).
						Update("parent_id", nil).Error; err != nil {
						return fmt.Errorf("failed to update parent ID to nil: %w", err)
					}
				} else {
					parentID, ok := pageGroupMap[*originalPageGroup.ParentID]
					if !ok {
						parentID = *originalPageGroup.ParentID
					}
					if err := tx.Model(&models.PageGroup{}).Where("id = ?", newID).
						Update("parent_id", parentID).Error; err != nil {
						return fmt.Errorf("failed to update parent ID: %w", err)
					}
				}
			}
		}

		for _, page := range originalDoc.Pages {
			if page.PageGroupID == nil {
				newPage := models.Page{
					DocumentationID: newDoc.ID,
					AuthorID:        page.AuthorID,
					Title:           page.Title,
					Slug:            page.Slug,
					Content:         page.Content,
					Order:           page.Order,
				}
				if err := tx.Create(&newPage).Error; err != nil {
					return fmt.Errorf("failed to create new page without group: %w", err)
				}
				for _, editor := range page.Editors {
					if err := tx.Model(&newPage).Association("Editors").Append(&editor); err != nil {
						return fmt.Errorf("failed to append editor to page without group: %w", err)
					}
				}
			}
		}

		return nil
	})

	if err != nil {
		return err
	}
	return nil
}

func (service *DocService) getAncestorDocuments(docID uint) ([]models.Documentation, error) {
	var ancestors []models.Documentation
	currentID := docID

	for {
		var doc models.Documentation
		if err := service.DB.Preload("PageGroups").First(&doc, currentID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				break
			}
			return nil, err
		}

		if doc.ClonedFrom == nil {
			break
		}

		ancestors = append(ancestors, doc)
		currentID = *doc.ClonedFrom
	}

	return ancestors, nil
}
