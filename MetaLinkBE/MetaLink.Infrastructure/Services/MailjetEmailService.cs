using System.Net.Http.Headers;
using System.Text;
using MetaLink.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;

namespace MetaLink.Persistence.Services
{
    public class MailjetEmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;

        public MailjetEmailService(IConfiguration config)
        {
            _config = config;
            _httpClient = new HttpClient();
        }

        public async Task SendForgotPasswordEmailAsync(string email, string resetLink)
        {
            var publicKey = _config["Mailjet:PublicKey"];
            var privateKey = _config["Mailjet:PrivateKey"];

            var auth = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{publicKey}:{privateKey}"));
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", auth);

            var body = new
            {
                Messages = new[]
                {
                    new {
                        From = new { Email = _config["Mailjet:Email"], Name = "MetaLink" },
                        To = new[] { new { Email = email, Name = email } },
                        Subject = "Şifre Sıfırlama Talebi",
                        TextPart = $"Şifrenizi sıfırlamak için tıklayın: {resetLink}"
                    }
                }
            };

            var json = JsonConvert.SerializeObject(body);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("https://api.mailjet.com/v3.1/send", content);
            response.EnsureSuccessStatusCode();
        }

        public async Task SendMessageEmailAsync(string message)
        {
            var publicKey = _config["Mailjet:PublicKey"];
            var privateKey = _config["Mailjet:PrivateKey"];

            var auth = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{publicKey}:{privateKey}"));
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", auth);

            var content = new StringContent(message, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("https://api.mailjet.com/v3.1/send", content);
            response.EnsureSuccessStatusCode();
        }
    }
}
