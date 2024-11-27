using Microsoft.AspNetCore.Mvc;
using BCrypt.Net;
using System.Threading.Tasks;
using BackendGermanSmartDetector.AppDbContext;
using BackendGermanSmartDetector.Models;

namespace BackendGermanSmartDetector.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RegistrationController: ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RegistrationController(ApplicationDbContext context)
        {
            _context = context;
        }
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] Users user)
        {
            if (user == null || string.IsNullOrWhiteSpace(user.Email) ||
                string.IsNullOrWhiteSpace(user.Phone) || string.IsNullOrWhiteSpace(user.Password))
            {
                return BadRequest(new { message = "Все поля обязательны для заполнения" });
            }

            user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password);

            try
            {
                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                return Created("", new { message = "Успешная регистрация" });
            }
            catch (Exception ex)
            {
                Console.WriteLine("Ошибка регистрации: " + ex.Message);
                return StatusCode(500, new { error = "Регистрация провалилась" });
            }
        }

    }
}
