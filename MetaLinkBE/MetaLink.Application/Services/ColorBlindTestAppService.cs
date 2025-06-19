using MetaLink.Application.DTOs;
using MetaLink.Application.Interfaces;
using MetaLink.Application.Requests;
using MetaLink.Application.Responses;
using MetaLink.Domain.Enums;
using MetaLink.Domain.Entities;
using Metalink.Domain.Interfaces;
using Metalink.Domain.Services;
using Newtonsoft.Json;
using Microsoft.Extensions.Configuration;

public class ColorBlindTestAppService : IColorBlindTestAppService
{
    private readonly IStudentService _studentService;
    private readonly IUserService _userService;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _config;

    // static plate-by-plate definitions:
    private static readonly Dictionary<int, (string url, List<string> opts, string correct)> _plates
        = new()
    {
        { 1, ("/plates/1.png",  new[]{"5","nothing"}.ToList(),   "nothing") },
        { 2, ("/plates/2.png",  new[]{"45","nothing"}.ToList(),  "nothing") },
        { 3, ("/plates/3.png",  new[]{"3","8"}.ToList(),         "8") },
        { 4, ("/plates/4.png",  new[]{"7","9","29"}.ToList(),    "29") },
        { 5, ("/plates/5.png",  new[]{"3","nothing"}.ToList(),   "3") },
        { 6, ("/plates/6.png",  new[]{"12","nothing"}.ToList(),  "12") },
        { 7, ("/plates/7.png",  new[]{"7","nothing"}.ToList(),   "7") },
        { 8, ("/plates/8.png",  new[]{"6","8","nothing"}.ToList(),"8") },
        { 9, ("/plates/9.png",  new[]{"5","2","nothing"}.ToList(),"5") },
        {10, ("/plates/10.png", new[]{"2","6","26"}.ToList(),    "26") },
        {11, ("/plates/11.png", new[]{"7","nothing"}.ToList(),   "7") },
        {12, ("/plates/12.png", new[]{"4","2","42"}.ToList(),   "42") },
    };

    public ColorBlindTestAppService(
        IStudentService studentService,
        IUserService userService,
        IEmailService emailService,
        IConfiguration config
    )
    {
        _studentService = studentService;
        _userService = userService;
        _emailService = emailService;
        _config = config;
    }

    public Task<List<ColorBlindQuestionDto>> GetColorBlindPlatesAsync(int studentId)
        => Task.FromResult(_plates
            .Select(kv => new ColorBlindQuestionDto
            {
                PlateId = kv.Key,
                ImageUrl = kv.Value.url,
                Options = kv.Value.opts,
                CorrectAnswer = kv.Value.correct
            })
            .ToList());

    public async Task<ColorBlindTestResponse> SubmitColorBlindTestAsync(ColorBlindTestRequest request)
    {
        var student = await _studentService.GetByIdAsync(request.StudentId)
                      ?? throw new ArgumentException("Student not found", nameof(request.StudentId));

        // counters (normal artık tutulmuyor)
        int redgreen = 0,
            blueyellow = 0,
            fullblind = 0;

        foreach (var ans in request.Answers)
        {
            if (!_plates.TryGetValue(ans.PlateId, out var plate))
                continue;

            var sel = ans.SelectedOption?.Trim();
            var ok = plate.correct.Trim();

            switch (ans.PlateId)
            {
                case 1:
                case 2:
                case 3:
                case 4:
                    if (sel != ok) redgreen++;
                    break;

                case 5:
                case 6:
                case 7:
                case 8:
                    if (sel != ok) blueyellow++;
                    break;

                case 9:
                    if (sel == "2") redgreen++;
                    else if (sel == "nothing") fullblind++;
                    break;

                case 10:
                    if (sel == "2" || sel == "6") fullblind++;
                    break;

                case 11:
                    if (sel != ok) fullblind++;
                    break;

                case 12:
                    if (sel == "4" || sel == "2") fullblind++;
                    break;
            }
        }

        // hangi kategoride 2'den fazla var?
        var thresholds = new Dictionary<int, int>
        {
            [1] = redgreen,
            [2] = blueyellow,
            [3] = fullblind
        };

        var overThreshold = thresholds
            .Where(kv => kv.Value > 2)
            .Select(kv => kv.Key)
            .ToList();

        int type;
        if (overThreshold.Count == 1)
        {
            type = overThreshold[0];
        }
        else if (overThreshold.Count > 1)
        {
            type = 4; // mixed
        }
        else
        {
            type = 0; // normal
        }

        // student güncelle
        student.ColorBlindType = (ColorBlindTypeEnum)type;
        student.ColorBilndCompleated = true;
        await _studentService.UpdateStudentAsync(student);

        // parent notification
        var parent = await _userService.GetByIdAsync(student.UserID);
        if (parent != null)
        {
            var displayName = ((ColorBlindTypeEnum)type).ToString();

            var resultMsg = type == 0
      ? "Test sonucunda potansiyel renk körlüğü <strong>tespit edilmemiştir.</strong>"
      : "Test sonucunda <strong>potansiyel renk körlüğü tespit edilmiştir.</strong>";

            var payload = new
            {
                Messages = new[] {
                new {
                    From     = new { Email = _config["Mailjet:Email"], Name = "MetaLink" },
                    To       = new[] { new { Email = parent.Email, Name = parent.FirstName + " " + parent.LastName } },
                    Subject  = "🎯 Renk Körlüğü Testi Sonucu",
    
                    HTMLPart = $@"
                       <h3>Sayın {parent.FirstName} {parent.LastName},</h3>
                       <p>Çocuğunuz <strong>{student.FirstName} {student.LastName}</strong> renk körlüğü testini tamamladı.</p> 
                       <p>{resultMsg}</p>
                       <p>Çocuğunuzun testi odaklanmış bir şekilde çözmüş olduğundan emin olunuz. Gerekirse bir uzmana danışabilirsiniz.</p>"
                }
            }
            };

            var json = JsonConvert.SerializeObject(payload);
            await _emailService.SendMessageEmailAsync(json);
        }

        return new ColorBlindTestResponse
        {
            ColorBlindType = (ColorBlindTypeEnum)type,
            Success = true
        };
    }

}
