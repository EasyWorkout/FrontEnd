const assert = require("node:assert/strict");

const EasyWorkout = require("../script.js");

function runTest(name, fn) {
    try {
        fn();
        console.log(`ok - ${name}`);
    } catch (error) {
        console.error(`not ok - ${name}`);
        console.error(error);
        process.exitCode = 1;
    }
}

const today = new Date("2026-07-03T12:00:00");

runTest("validateRegistration rejects invalid or duplicate users", () => {
    const existing = [{ email: "ana@example.com" }];

    assert.deepEqual(EasyWorkout.validateRegistration({
        nome: "",
        email: "ana@example.com",
        senha: "123",
        nascimento: "2030-01-01",
        genero: "",
        nivel: "",
        objetivo: "",
        dias: "",
    }, existing, today).valid, false);

    const result = EasyWorkout.validateRegistration({
        nome: "Ana Silva",
        email: "ana@example.com",
        senha: "12345678",
        nascimento: "2000-01-01",
        genero: "feminino",
        nivel: "iniciante",
        objetivo: "saude",
        dias: "3",
    }, existing, today);

    assert.equal(result.valid, false);
    assert.equal(result.errors.email, "Este e-mail já está cadastrado.");
});

runTest("registerUser normalizes data and creates starter state", () => {
    const users = EasyWorkout.registerUser({
        nome: "  Bruno Costa  ",
        email: "BRUNO@EXAMPLE.COM",
        senha: "12345678",
        nascimento: "1998-05-10",
        genero: "masculino",
        nivel: "intermediario",
        objetivo: "hipertrofia",
        dias: "4",
    }, [], today);

    assert.equal(users.length, 1);
    assert.equal(users[0].nome, "Bruno Costa");
    assert.equal(users[0].email, "bruno@example.com");
    assert.equal(users[0].profile.dias, "4");
    assert.equal(users[0].profile.objetivos.includes("hipertrofia"), true);
    assert.equal(users[0].workouts.length > 0, true);
    assert.deepEqual(users[0].history, []);
});

runTest("validateLogin accepts only matching saved credentials", () => {
    const users = [{ email: "bia@example.com", senha: "senha123" }];

    assert.equal(EasyWorkout.validateLogin({
        email: "BIA@example.com",
        senha: "senha123",
    }, users).valid, true);

    const result = EasyWorkout.validateLogin({
        email: "bia@example.com",
        senha: "errada123",
    }, users);

    assert.equal(result.valid, false);
    assert.equal(result.errors.form, "E-mail ou senha inválidos.");
});

runTest("calculateImc returns value, category and marker position", () => {
    const imc = EasyWorkout.calculateImc(178, 76);

    assert.equal(imc.value, "24.0");
    assert.equal(imc.category, "Peso normal");
    assert.equal(imc.position > 35 && imc.position < 45, true);
});

runTest("createWorkout validates required fields and builds an executable workout", () => {
    const invalid = EasyWorkout.validateWorkout({
        nome: "",
        tipo: "",
        duracao: "5",
        nivel: "",
    });

    assert.equal(invalid.valid, false);
    assert.equal(invalid.errors.nome, "Informe o nome do treino.");

    const workout = EasyWorkout.createWorkout({
        nome: "Treino E - Full Body",
        tipo: "funcional",
        duracao: "45",
        nivel: "iniciante",
        obs: "Mobilidade, core",
    }, today);

    assert.equal(workout.nome, "Treino E - Full Body");
    assert.equal(workout.duracao, 45);
    assert.equal(workout.exercises.length, 1);
    assert.equal(workout.tags.includes("Mobilidade"), true);
});

runTest("calculateSessionStats and finishWorkout summarize completed sets", () => {
    const workout = {
        id: "treino-a",
        nome: "Treino A",
        tipo: "hipertrofia",
        exercises: [
            { id: "supino", nome: "Supino", sets: 2, meta: "8-12", descanso: 90 },
            { id: "crucifixo", nome: "Crucifixo", sets: 1, meta: "12", descanso: 60 },
        ],
    };
    const entries = {
        supino: [
            { carga: 40, reps: 10 },
            { carga: 45, reps: 8 },
        ],
        crucifixo: [
            { carga: 0, reps: 0 },
        ],
    };

    const stats = EasyWorkout.calculateSessionStats(workout, entries);
    assert.equal(stats.completedSets, 2);
    assert.equal(stats.totalSets, 3);
    assert.equal(stats.completedExercises, 1);
    assert.equal(stats.volume, 760);

    const session = EasyWorkout.finishWorkout(workout, entries, today, new Date("2026-07-03T13:00:00"));
    assert.equal(session.workoutName, "Treino A");
    assert.equal(session.volume, 760);
    assert.equal(session.records[0].exerciseName, "Supino");
    assert.equal(session.records[0].maxLoad, 45);
});
