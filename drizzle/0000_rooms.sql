CREATE TABLE rooms (code TEXT PRIMARY KEY NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL, expires INTEGER NOT NULL);
--> statement-breakpoint
CREATE INDEX rooms_expiry ON rooms (expires);
--> statement-breakpoint
CREATE TABLE room_presence (code TEXT NOT NULL, member_key TEXT NOT NULL, seen INTEGER NOT NULL, PRIMARY KEY (code, member_key));
--> statement-breakpoint
CREATE TABLE room_limits (id TEXT PRIMARY KEY NOT NULL, count INTEGER NOT NULL, expires INTEGER NOT NULL);
--> statement-breakpoint
CREATE INDEX room_limits_expiry ON room_limits (expires);
