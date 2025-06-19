using System.Security.Claims;
using Metalink.Application.Interfaces;
using Metalink.Application.Mapping;
using Metalink.Application.Services;
using Metalink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using Metalink.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Metalink.Application.AppServices;
using Metalink.Domain.Services;
using MetaLink.Application.Interfaces;
using MetaLink.Persistence.Services;
using MetaLink.Domain.Interfaces;
using MetaLink.Domain.Services;
using MetaLink.Persistence.Repositories;
using MetaLink.Application.Services;
using MetaLink.API.Hubs;
using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);

// 1) CORS Configuration
//builder.Services.AddCors(options =>
//{
//    options.AddPolicy("AllowAllOrigins",
//        policy => policy
//            .AllowAnyOrigin()
//            .AllowAnyMethod()
//            .AllowAnyHeader());
//});
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // Frontend'in origin'i
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Kimlik doğrulama için gerekli
    });
});
// 2) Database Context
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 3) Controllers & Swagger
builder.Services.AddControllers();
builder.Services.AddSingleton<IWebHostEnvironment>(builder.Environment);
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "MetaLinkAPI",
        Version = "v1",
        Description = "API documentation for MetaLink application",
        Contact = new OpenApiContact
        {
            Name = "Support Team",
            Email = "support@example.com",
        }
    });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\""
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            new string[] { }
        }
    });
});

builder.Services.AddScoped<IGameRepository, GameRepository>();
builder.Services.AddScoped<IXPRecordRepository, XPRecordRepository>();
builder.Services.AddScoped<IGameProgressRepository, GameProgressRepository>();
builder.Services.AddScoped<IXPService, XPService>();
builder.Services.AddScoped<IGameService, GameService>();
builder.Services.AddScoped<IGameInviteService, GameInviteService>();
builder.Services.AddScoped<IGameInviteRepository, GameInviteRepository>();

// User and Authentication Services
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IUserAppService, UserAppService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IEmailService, MailjetEmailService>();
builder.Services.AddScoped<IEncryptionService, AESEncryptionService>();

// Student-Related Services and Repositories
builder.Services.AddScoped<IStudentRepository, StudentRepository>();
builder.Services.AddScoped<IStudentService, StudentService>();
builder.Services.AddScoped<IStudentAppService, StudentAppService>();

// Course, Lesson, and SubLesson Repositories
builder.Services.AddScoped<ICourseRepository, CourseRepository>();
builder.Services.AddScoped<ICourseService, CourseService>();
builder.Services.AddScoped<ILessonRepository, LessonRepository>();
builder.Services.AddScoped<ILessonService, LessonService>();
builder.Services.AddScoped<ISubLessonRepository, SubLessonRepository>();
builder.Services.AddScoped<ISubLessonService, SubLessonService>();

// Student Progress Tracking Repositories
builder.Services.AddScoped<IStudentCourseRepository, StudentCourseRepository>();
builder.Services.AddScoped<IStudentLessonRepository, StudentLessonRepository>();
builder.Services.AddScoped<IStudentSubLessonRepository, StudentSubLessonRepository>();

// Course, Lesson, and SubLesson Application Services
builder.Services.AddScoped<ICourseAppService, CourseAppService>();
builder.Services.AddScoped<ILessonAppService, LessonAppService>();
builder.Services.AddScoped<ISubLessonAppService, SubLessonAppService>();
builder.Services.AddScoped<IStudentCourseAppService, StudentCourseAppService>();
builder.Services.AddScoped<IStudentLessonAppService, StudentLessonAppService>();
builder.Services.AddScoped<IStudentSubLessonAppService, StudentSubLessonAppService>();

// Education Content Services
builder.Services.AddScoped<IEducationContentAppService, EducationContentAppService>();

// Avatar Services and Repositories
builder.Services.AddScoped<IAvatarRepository, AvatarRepository>();
builder.Services.AddScoped<IAvatarService, AvatarService>();

// AI and ChatGPT Services
builder.Services.AddHttpClient<IChatGptService, ChatGptService>();
builder.Services.AddScoped<IAiPromptRepository, AiPromptRepository>();
builder.Services.AddScoped<IAiPromptService, AiPromptService>();
builder.Services.AddScoped<IAiGeneratedContentRepository, AIGeneratedContentRepository>();
builder.Services.AddScoped<IAIGeneratedContentService, AIGeneratedContentService>();

// Test, Quiz and Exam Services and Repositories
builder.Services.AddScoped<ITestRepository, TestRepository>();
builder.Services.AddScoped<ITestQuestionRepository, TestQuestionRepository>();
builder.Services.AddScoped<ITestQuestionOptionRepository, TestQuestionOptionRepository>();
builder.Services.AddScoped<ITestAnswerRepository, TestAnswerRepository>();
builder.Services.AddScoped<ITestService, TestService>();
builder.Services.AddScoped<ITestQuestionService, TestQuestionService>();
builder.Services.AddScoped<ITestQuestionOptionService, TestQuestionOptionService>();
builder.Services.AddScoped<ITestAnswerService, TestAnswerService>();
builder.Services.AddScoped<IQuizRepository, QuizRepository>();
builder.Services.AddScoped<IQuizService, QuizService>();
builder.Services.AddScoped<IQuizAnswerRepository, QuizAnswerRepository>();
builder.Services.AddScoped<IQuizAnswerService, QuizAnswerService>();
builder.Services.AddScoped<IQuizQuestionRepository, QuizQuestionRepository>();
builder.Services.AddScoped<IQuizQuestionService, QuizQuestionService>();
builder.Services.AddScoped<IQuizQuestionOptionRepository, QuizQuestionOptionRepository>();
builder.Services.AddScoped<IQuizQuestionOptionService, QuizQuestionOptionService>();
builder.Services.AddScoped<IExamAppService, ExamAppService>();

// Progress Service and Repositories
builder.Services.AddScoped<ICourseProgressRepository, CourseProgressRepository>();
builder.Services.AddScoped<ILessonProgressRepository, LessonProgressRepository>();
builder.Services.AddScoped<ISubLessonProgressRepository, SubLessonProgressRepository>();
builder.Services.AddScoped<ICourseProgressService, CourseProgressService>();
builder.Services.AddScoped<ILessonProgressService, LessonProgressService>();
builder.Services.AddScoped<ISubLessonProgressService, SubLessonProgressService>();

// Learning Styles Service and Repositories
builder.Services.AddScoped<ILearningStyleAnswerRepository, LearningStyleAnswerRepository>();
builder.Services.AddScoped<ILearningStyleCategoryRepository, LearningStyleCategoryRepository>();
builder.Services.AddScoped<ILearningStyleQuestionRepository, LearningStyleQuestionRepository>();
builder.Services.AddScoped<ILearningStyleAnswerService, LearningStyleAnswerService>();
builder.Services.AddScoped<ILearningStyleCategoryService, LearningStyleCategoryService>();
builder.Services.AddScoped<ILearningStyleQuestionService, LearningStyleQuestionService>();
builder.Services.AddScoped<ILearningStyleAppService, LearningStyleAppService>();

// Admin Services
builder.Services.AddScoped<IAdminAppService, AdminService>();

// Statistics Service and Repositories
builder.Services.AddScoped<IStudentTestStatisticRepository, StudentTestStatisticRepository>();
builder.Services.AddScoped<IStudentTestStatisticService, StudentTestStatisticService>();

// Company Profile Service and Repositories
builder.Services.AddScoped<ICompanyProfileRepository, CompanyProfileRepository>();
builder.Services.AddScoped<ICompanyProfileService, CompanyProfileService>();

// Chat Message Service and Repositories
builder.Services.AddScoped<IChatMessageRepository, ChatMessageRepository>();
builder.Services.AddScoped<IChatMessageService, ChatMessageService>(); 
builder.Services.AddScoped<IChatContextService, ChatContextService>();

// StudentFriendship Service and Repositories
builder.Services.AddScoped<IStudentFriendshipRepository, StudentFriendshipRepository>();
builder.Services.AddScoped<IStudentFriendshipService, StudentFriendshipService>(); 
builder.Services.AddScoped<IStudentFriendshipAppService, StudentFriendshipAppService>(); 

// Message Service and Repositories
builder.Services.AddScoped<IMessageRepository, MessageRepository>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<IMessageAppService, MessageAppService>();

// Report Service and Repositories
builder.Services.AddScoped<IStudentReportService, StudentReportService>();
builder.Services.AddScoped<IStudentReportRepository, StudentReportRepository>();

//review
builder.Services.AddScoped<IReviewSessionService, ReviewSessionService>();
builder.Services.AddScoped<IReviewSessionRepository, ReviewSessionRepository>();

//color blind
builder.Services.AddScoped<IColorBlindTestAppService, ColorBlindTestAppService>();


// 6) AutoMapper (avoid ambiguity)
builder.Services.AddAutoMapper(cfg =>
{
    cfg.AddProfile<MappingProfile>();
});

// 7) JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = jwtSettings["Key"];
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var keyBytes = Encoding.UTF8.GetBytes(key);
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero,
        RoleClaimType = ClaimTypes.Role, // requires using System.Security.Claims
        NameClaimType = ClaimTypes.NameIdentifier
    };
});

var app = builder.Build();

app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
//app.UseCors("AllowAllOrigins");
app.UseCors("AllowReactApp");
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<GameHub>("/gamehub");
app.Run();
