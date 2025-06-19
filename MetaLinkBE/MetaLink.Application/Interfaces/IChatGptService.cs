using System.Text.Json;
using MetaLink.Application.Requests;
using MetaLink.Application.Responses;
using MetaLink.Domain.Entities;
using MetaLink.Domain.Enums;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace MetaLink.Application.Interfaces
{
    public interface IChatGptService
    {
        Task<ChatGptResponse> AvatarChatMessageAsync(UserMessage message);
        Task<ChatGptResponse> AskQuestionAssistantRobot(UserMessage message);
        Task<string> SendAiRequestAsync(List<ChatGptMessage> messages, string model = "gpt-4o-mini", double temperature = 0.7, int maxTokens = 2000);
        Task AnalyzeMessageContentAsync(string message, AnalizeMessageContentRequest analizeMessageContentRequest);
        Task<ChatGptResponse> HandleAudioAvatarChatAsync(IFormFile audio, int studentId);
        Task<List<StoryCardResponse>> GenerateStoryAsync(int studentId, int cardCount);
        Task<List<QuizQuestionGameResponse>> GenerateQuizQuestionsAsync(string topic);
        Task GenerateImagesForContent(string lessonTitle, string subLessonTitle, int studentAge, string jsonContent, IWebHostEnvironment environment, AIGeneratedContent aIGeneratedContent = null, AIGeneratedContent filteredContentReady = null, bool isReviewSession = false, ReviewSession reviewSession = null, ReviewSession filteredReviewSessionReady = null, Dictionary<int, JsonElement> contentMap = null);
        Task<byte[]> SynthesizeSpeechAsync(string text, VoiceTypeEnum voiceType);
    }
}
