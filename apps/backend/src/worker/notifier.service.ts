interface NotificationPayload {
    monitorName: string;
    targetUrl: string;
    status: "UP" | "DOWN";
    errorMessage?: string | null;
    responseTimeMs?: number;
}

export async function sendWebhookNotification(webhookUrl: string, payload: NotificationPayload): Promise<void> {
    const isDown = payload.status === "DOWN";

    const color = isDown ? 15158332 : 3066993;
    const title = isDown
    ? `🔴 INCIDENT: ${payload.monitorName} is DOWN`
    : `🟢 RESOLVED: ${payload.monitorName} is BACK UP`;

    const fields = [
        { name: "Target URL", value: payload.targetUrl, inline: true },
        { name: "Status", value: payload.status, inline: true},
    ];

    if(payload.responseTimeMs !== undefined) {
        fields.push({
            name: "Response Time",
            value: `${payload.responseTimeMs}`,
            inline: true,
        });
    }

    if(payload.errorMessage) {
        fields.push({
            name: "Error Details",
            value: `\`\`\`${payload.errorMessage}\`\`\``,
            inline: false,
        });
    }

    const discordPayload = {
        embeds: [
            {
                title,
                color,
                fields,
                timestamp: new Date().toISOString(),
            },
        ],
    };

    try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(discordPayload),
        });

        if(!response.ok) {
            console.error(`Webhook could not be sent [${response.status}]: ${response.statusText}`);
        }
    }
    catch(err) {
        console.error("Error trying to send a webhook notification", err);
    }
}