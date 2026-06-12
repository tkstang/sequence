CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invite_code" text NOT NULL,
	"created_by" text NOT NULL,
	"rematch_of" uuid,
	"local" boolean DEFAULT false NOT NULL,
	"player_count" smallint NOT NULL,
	"mode" text NOT NULL,
	"timer_seconds" integer,
	"status" text DEFAULT 'lobby' NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"current_seat" smallint,
	"round" integer DEFAULT 0 NOT NULL,
	"turn_deadline_at" timestamp with time zone,
	"turn_remaining_ms" integer,
	"pending_choice" jsonb,
	"board" jsonb,
	"deck" jsonb,
	"played" jsonb,
	"sequences" jsonb,
	"winner_team" smallint,
	"end_reason" text,
	"finished_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"seat" smallint NOT NULL,
	"team" smallint NOT NULL,
	"user_id" text,
	"guest_name" text,
	"guest_token_hash" text,
	"hand" jsonb,
	"connected" boolean DEFAULT false NOT NULL,
	"last_seen_at" timestamp with time zone,
	"is_creator" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"seq" bigint NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"actor_seat" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "game_players" ADD CONSTRAINT "game_players_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_events" ADD CONSTRAINT "game_events_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "games_invite_code_idx" ON "games" USING btree ("invite_code");--> statement-breakpoint
CREATE INDEX "games_status_finished_at_idx" ON "games" USING btree ("status","finished_at");--> statement-breakpoint
CREATE UNIQUE INDEX "game_players_game_seat_idx" ON "game_players" USING btree ("game_id","seat");--> statement-breakpoint
CREATE INDEX "game_players_user_game_idx" ON "game_players" USING btree ("user_id","game_id");--> statement-breakpoint
CREATE UNIQUE INDEX "game_events_game_seq_idx" ON "game_events" USING btree ("game_id","seq");