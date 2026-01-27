package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/graphql-go/graphql"
	"github.com/graphql-go/handler"
)

type MenuName struct {
	En string `json:"en"`
	Es string `json:"es"`
	Pt string `json:"pt"`
}

type MenuSummary struct {
	ID        string   `json:"_id"`
	MenuSlug  string   `json:"menuSlug"`
	Name      MenuName `json:"name"`
	Available bool     `json:"available"`
}

var menus = []MenuSummary{
	{
		ID:       "stacked_up_menu_v1",
		MenuSlug: "stacked-up",
		Name: MenuName{
			En: "Stacked Up Menu",
			Es: "",
			Pt: "",
		},
		Available: true,
	},
	{
		ID:       "cuppa_co_lunch_v1",
		MenuSlug: "cuppa-co-lunch",
		Name: MenuName{
			En: "Cuppa Co Lunch",
			Es: "",
			Pt: "",
		},
		Available: true,
	},
}

func main() {
	menuNameType := graphql.NewObject(graphql.ObjectConfig{
		Name: "MenuName",
		Fields: graphql.Fields{
			"en": &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
			"es": &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
			"pt": &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
		},
	})

	menuSummaryType := graphql.NewObject(graphql.ObjectConfig{
		Name: "MenuSummary",
		Fields: graphql.Fields{
			"_id": &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
			"menuSlug": &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
			"name": &graphql.Field{Type: graphql.NewNonNull(menuNameType)},
			"available": &graphql.Field{Type: graphql.NewNonNull(graphql.Boolean)},
		},
	})

	queryType := graphql.NewObject(graphql.ObjectConfig{
		Name: "Query",
		Fields: graphql.Fields{
			"menus": &graphql.Field{
				Type: graphql.NewNonNull(graphql.NewList(menuSummaryType)),
				Args: graphql.FieldConfigArgument{
					"restaurantId": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
					"locationId": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				},
				Resolve: func(params graphql.ResolveParams) (interface{}, error) {
					return menus, nil
				},
			},
		},
	})

	schema, err := graphql.NewSchema(graphql.SchemaConfig{Query: queryType})
	if err != nil {
		log.Fatalf("failed to create schema: %v", err)
	}

	gqlHandler := handler.New(&handler.Config{
		Schema:   &schema,
		Pretty:   true,
		GraphiQL: true,
	})

	mux := http.NewServeMux()
	mux.Handle("/graphql", withCORS(gqlHandler))
	mux.Handle("/", withCORS(gqlHandler))

	addr := ":8080"
	if port := os.Getenv("PORT"); port != "" {
		addr = ":" + port
	}

	server := &http.Server{
		Addr:              addr,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("Go GraphQL demo listening on %s", addr)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}

func withCORS(next http.Handler) http.Handler {
	allowOrigin := os.Getenv("CORS_ORIGIN")
	if allowOrigin == "" {
		allowOrigin = "*"
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", allowOrigin)
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
