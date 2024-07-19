package tree_sitter_log_insights_query_test

import (
	"testing"

	tree_sitter "github.com/smacker/go-tree-sitter"
	"github.com/tree-sitter/tree-sitter-log_insights_query"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_log_insights_query.Language())
	if language == nil {
		t.Errorf("Error loading LogInsightsQuery grammar")
	}
}
