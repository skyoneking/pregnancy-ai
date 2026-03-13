"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";

export default function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, addToolApprovalResponse } = useChat();
  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map((message) => (
        <div key={message.id} className="whitespace-pre-wrap">
          {message.role === "user" ? "User: " : "AI: "}
          {message.parts.map((part, i) => {
            if (part.type === "text") {
              return <div key={i}>{part.text}</div>;
            }
            if (part.type === "data-status") {
              return (
                message.parts.at(-1)?.type !== "text" && (
                  <div
                    key={`${message.id}-${i}`}
                    className="text-sm text-gray-500"
                  >
                    {(part.data as { message?: string })?.message}
                  </div>
                )
              );
            }
            if (part.type === "tool-getWeatherInformation") {
              type WeatherPart = typeof part & {
                input: { city: string };
                approval: { id: string };
                output: string;
              };
              const wp = part as WeatherPart;
              switch (part.state) {
                case "approval-requested":
                  return (
                    <div key={part.toolCallId}>
                      Get weather information for {wp.input.city}?
                      <div>
                        <button
                          onClick={() =>
                            addToolApprovalResponse({
                              id: wp.approval.id,
                              approved: true,
                            })
                          }
                        >
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            addToolApprovalResponse({
                              id: wp.approval.id,
                              approved: false,
                            })
                          }
                        >
                          Deny
                        </button>
                      </div>
                    </div>
                  );
                case "output-available":
                  return (
                    <div key={part.toolCallId}>
                      Weather in {wp.input.city}: {wp.output}
                    </div>
                  );
                case "output-denied":
                  return (
                    <div key={part.toolCallId}>
                      Weather request for {wp.input.city} was denied.
                    </div>
                  );
              }
            }
          })}
        </div>
      ))}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput("");
        }}
      >
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
