import { useMutation } from "@tanstack/react-query";
import { sendChatMessageRequest } from "@/services/chat";

export const useSendChatMessage = () => {
  return useMutation({
    mutationFn: (payload: IChatRequest) => sendChatMessageRequest(payload),
  });
};
