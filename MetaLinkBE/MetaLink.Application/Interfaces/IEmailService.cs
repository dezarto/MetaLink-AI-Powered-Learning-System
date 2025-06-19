namespace MetaLink.Application.Interfaces
{
    public interface IEmailService
    {
        Task SendForgotPasswordEmailAsync(string email, string resetLink);
        Task SendMessageEmailAsync(string message);
    }
}
