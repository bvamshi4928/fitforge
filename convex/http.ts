import {  httpRouter } from "convex/server";
import {WebhookEvent} from "@clerk/nextjs/server";
import {Webhook} from "svix";

import {api} from "./_generated/api";
import {httpAction} from "./_generated/server";

const http = httpRouter();

http.route({
  path:"/clerk-webhook",
    method: "POST",
    handler: httpAction(async (ctx,request)=>{

        const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
        if (!webhookSecret) {
            throw new Error("CLERK_WEBHOOK_SECRET is not set");
            }       
        
        const svix_id = request.headers.get("svix-id");
        const svix_timestamp = request.headers.get("svix-timestamp");
        const svix_signature = request.headers.get("svix-signature");
        if (!svix_id || !svix_timestamp || !svix_signature) {
            return new Response("Missing svix headers", {
                status: 400,
            });
        }

        const payload = await request.json();
        const body = JSON.stringify(payload);

        const wh = new Webhook(webhookSecret);
        let evt : WebhookEvent;
        try {
            evt = wh.verify(body, {
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            }) as WebhookEvent;
        } catch (err) {
            return new Response("Invalid svix signature", {
                status: 400,
            });
        }

        const eventType = evt.type;

        if(eventType === "user.created" ) {
            // const {id,first_name,last_name,image_url,email_addresses} = evt.data;

            // const email = email_addresses[0]?.email_address;

            // const name = `${first_name || ""} ${last_name || ""}`.trim();
             const user = evt.data;

            const id = user.id;
            const first_name = user.first_name || "";
            const last_name = user.last_name || "";
            const image_url = user.image_url;
            const email = user.email_addresses?.[0]?.email_address;

            const name = `${first_name} ${last_name}`.trim();
            try{
                await ctx.runMutation(
                    api.users.syncUser,{
                        email,
                        name,
                        image: image_url,
                        clerkId: id

                    }
                )

            }   catch (error) {
                console.error("Error processing user.created event:", error);
                return new Response("Internal Server Error", {
                    status: 500,
                });
            }
        }


        return new Response("webhooks processed successfully", {
            status: 200,
        });

    })
})


export default http;