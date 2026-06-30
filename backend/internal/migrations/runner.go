package migrations

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

type Runner struct {
	db *sql.DB
}

func NewRunner(db *sql.DB) *Runner {
	return &Runner{db: db}
}

func (r *Runner) Run(migrationDir string) error {
	if r.db == nil {
		log.Println("no real database connection, skipping migrations")
		return nil
	}

	if err := r.ensureMigrationsTable(); err != nil {
		return fmt.Errorf("ensure migrations table: %w", err)
	}

	files, err := os.ReadDir(migrationDir)
	if err != nil {
		return fmt.Errorf("read migrations dir: %w", err)
	}

	var sqlFiles []string
	for _, f := range files {
		if !f.IsDir() && strings.HasSuffix(f.Name(), ".sql") {
			sqlFiles = append(sqlFiles, f.Name())
		}
	}
	sort.Strings(sqlFiles)

	applied, err := r.getAppliedMigrations()
	if err != nil {
		return fmt.Errorf("get applied migrations: %w", err)
	}

	appliedSet := make(map[string]bool, len(applied))
	for _, m := range applied {
		appliedSet[m] = true
	}

	for _, file := range sqlFiles {
		if appliedSet[file] {
			log.Printf("migration %s already applied, skipping", file)
			continue
		}
		content, err := os.ReadFile(filepath.Join(migrationDir, file))
		if err != nil {
			return fmt.Errorf("read migration %s: %w", file, err)
		}
		tx, err := r.db.Begin()
		if err != nil {
			return fmt.Errorf("begin tx for %s: %w", file, err)
		}
		if _, err := tx.Exec(string(content)); err != nil {
			tx.Rollback()
			return fmt.Errorf("execute migration %s: %w", file, err)
		}
		if _, err := tx.Exec("INSERT INTO schema_migrations (filename) VALUES ($1)", file); err != nil {
			tx.Rollback()
			return fmt.Errorf("record migration %s: %w", file, err)
		}
		if err := tx.Commit(); err != nil {
			return fmt.Errorf("commit migration %s: %w", file, err)
		}
		log.Printf("migration %s applied", file)
	}
	return nil
}

func (r *Runner) ensureMigrationsTable() error {
	query := `CREATE TABLE IF NOT EXISTS schema_migrations (
		filename VARCHAR(255) PRIMARY KEY,
		applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	)`
	_, err := r.db.Exec(query)
	return err
}

func (r *Runner) getAppliedMigrations() ([]string, error) {
	rows, err := r.db.Query("SELECT filename FROM schema_migrations ORDER BY filename")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		result = append(result, name)
	}
	return result, rows.Err()
}
