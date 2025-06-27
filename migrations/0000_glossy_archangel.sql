CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"forwarding_pair_id" integer,
	"telegram_session_id" integer,
	"type" text NOT NULL,
	"action" text NOT NULL,
	"message" text NOT NULL,
	"details" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocked_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"forwarding_pair_id" integer,
	"image_hash" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocked_sentences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"forwarding_pair_id" integer,
	"sentence" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_filters" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"forwarding_pair_id" integer,
	"type" text NOT NULL,
	"pattern" text NOT NULL,
	"action" text NOT NULL,
	"replacement" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forwarding_pairs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"telegram_session_id" integer NOT NULL,
	"source_channel" text NOT NULL,
	"destination_channel" text NOT NULL,
	"delay" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"copy_mode" boolean DEFAULT false NOT NULL,
	"silent_mode" boolean DEFAULT false NOT NULL,
	"forward_edits" boolean DEFAULT true NOT NULL,
	"forward_deletions" boolean DEFAULT false NOT NULL,
	"message_type" text DEFAULT 'all' NOT NULL,
	"chain_forwarding" boolean DEFAULT false NOT NULL,
	"messages_forwarded" integer DEFAULT 0 NOT NULL,
	"success_rate" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_activity" timestamp
);
--> statement-breakpoint
CREATE TABLE "forwarding_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"forwarding_pair_id" integer NOT NULL,
	"message_id" text NOT NULL,
	"source_chat" text NOT NULL,
	"destination_chat" text NOT NULL,
	"message_content" jsonb NOT NULL,
	"scheduled_time" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"payment_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_method" text NOT NULL,
	"transaction_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "payments_payment_id_unique" UNIQUE("payment_id")
);
--> statement-breakpoint
CREATE TABLE "telegram_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"phone_number" text NOT NULL,
	"session_string" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_health_check" timestamp,
	"account_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"plan_expiry_date" timestamp,
	"watermark_config" jsonb,
	"telegram_accounts" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_forwarding_pair_id_forwarding_pairs_id_fk" FOREIGN KEY ("forwarding_pair_id") REFERENCES "public"."forwarding_pairs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_telegram_session_id_telegram_sessions_id_fk" FOREIGN KEY ("telegram_session_id") REFERENCES "public"."telegram_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_images" ADD CONSTRAINT "blocked_images_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_images" ADD CONSTRAINT "blocked_images_forwarding_pair_id_forwarding_pairs_id_fk" FOREIGN KEY ("forwarding_pair_id") REFERENCES "public"."forwarding_pairs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_sentences" ADD CONSTRAINT "blocked_sentences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_sentences" ADD CONSTRAINT "blocked_sentences_forwarding_pair_id_forwarding_pairs_id_fk" FOREIGN KEY ("forwarding_pair_id") REFERENCES "public"."forwarding_pairs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_filters" ADD CONSTRAINT "content_filters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_filters" ADD CONSTRAINT "content_filters_forwarding_pair_id_forwarding_pairs_id_fk" FOREIGN KEY ("forwarding_pair_id") REFERENCES "public"."forwarding_pairs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forwarding_pairs" ADD CONSTRAINT "forwarding_pairs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forwarding_pairs" ADD CONSTRAINT "forwarding_pairs_telegram_session_id_telegram_sessions_id_fk" FOREIGN KEY ("telegram_session_id") REFERENCES "public"."telegram_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forwarding_queue" ADD CONSTRAINT "forwarding_queue_forwarding_pair_id_forwarding_pairs_id_fk" FOREIGN KEY ("forwarding_pair_id") REFERENCES "public"."forwarding_pairs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_sessions" ADD CONSTRAINT "telegram_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;