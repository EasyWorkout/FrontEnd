(function (root, factory) {
    const api = factory();

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }

    if (typeof window !== "undefined") {
        window.EasyWorkout = api;
        window.addEventListener("DOMContentLoaded", api.initPage);
    }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    const USERS_KEY = "easyWorkoutUsers";
    const SESSION_KEY = "easyWorkoutSession";
    const SELECTED_WORKOUT_KEY = "easyWorkoutSelectedWorkout";

    const workoutTypes = {
        hipertrofia: "Hipertrofia",
        forca: "Força",
        condicionamento: "Condicionamento",
        funcional: "Funcional",
    };

    const levels = {
        iniciante: "Iniciante",
        intermediario: "Intermediário",
        avancado: "Avançado",
    };

    const goals = {
        hipertrofia: "Ganho de massa muscular",
        forca: "Aumento de força",
        emagrecimento: "Emagrecimento e definição",
        condicionamento: "Condicionamento físico",
        saude: "Saúde e bem-estar",
    };

    const genders = ["masculino", "feminino", "outro", "nao-informar"];
    const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

    function normalizeEmail(email) {
        return String(email || "").trim().toLowerCase();
    }

    function cleanText(value) {
        return String(value || "").replace(/\s+/g, " ").trim();
    }

    function toNumber(value) {
        if (value === null || value === undefined || value === "") {
            return NaN;
        }

        return Number(value);
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(email));
    }

    function parseLocalDate(value) {
        if (!value) {
            return null;
        }

        const date = new Date(`${value}T00:00:00`);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function startOfDay(date) {
        const value = new Date(date);
        value.setHours(0, 0, 0, 0);
        return value;
    }

    function isFutureDate(value, today) {
        const date = parseLocalDate(value);
        return date ? date > startOfDay(today || new Date()) : false;
    }

    function calculateAge(value, today) {
        const birthDate = parseLocalDate(value);
        if (!birthDate) {
            return null;
        }

        const reference = today || new Date();
        let age = reference.getFullYear() - birthDate.getFullYear();
        const monthDiff = reference.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birthDate.getDate())) {
            age -= 1;
        }

        return age;
    }

    function createId(prefix, date) {
        const stamp = (date || new Date()).getTime().toString(36);
        const suffix = Math.random().toString(36).slice(2, 8);
        return `${prefix}-${stamp}-${suffix}`;
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function getDefaultWorkouts() {
        return clone([
            {
                id: "treino-a",
                nome: "Treino A - Peito e Tríceps",
                tipo: "hipertrofia",
                nivel: "intermediario",
                duracao: 65,
                tags: ["Peito", "Tríceps", "Ombro"],
                obs: "Foco em empurrar com controle de carga.",
                exercises: [
                    { id: "supino-reto", nome: "Supino Reto com Barra", sets: 4, meta: "8-12", descanso: 90 },
                    { id: "supino-inclinado", nome: "Supino Inclinado com Halteres", sets: 3, meta: "10-15", descanso: 75 },
                    { id: "crucifixo", nome: "Crucifixo com Halteres", sets: 3, meta: "12-15", descanso: 60 },
                    { id: "triceps-pulley", nome: "Tríceps Pulley", sets: 4, meta: "12", descanso: 60 },
                    { id: "triceps-testa", nome: "Tríceps Testa com Barra", sets: 3, meta: "10", descanso: 60 },
                ],
            },
            {
                id: "treino-b",
                nome: "Treino B - Costas e Bíceps",
                tipo: "hipertrofia",
                nivel: "intermediario",
                duracao: 60,
                tags: ["Costas", "Bíceps"],
                obs: "Puxadas verticais e remadas.",
                exercises: [
                    { id: "puxada-frente", nome: "Puxada Frente", sets: 4, meta: "8-12", descanso: 90 },
                    { id: "remada-curvada", nome: "Remada Curvada", sets: 3, meta: "8-10", descanso: 90 },
                    { id: "remada-baixa", nome: "Remada Baixa", sets: 3, meta: "10-12", descanso: 75 },
                    { id: "rosca-direta", nome: "Rosca Direta", sets: 3, meta: "10-12", descanso: 60 },
                ],
            },
            {
                id: "treino-c",
                nome: "Treino C - Pernas",
                tipo: "forca",
                nivel: "intermediario",
                duracao: 75,
                tags: ["Quadríceps", "Posterior", "Glúteo"],
                obs: "Priorize amplitude e estabilidade.",
                exercises: [
                    { id: "agachamento", nome: "Agachamento Livre", sets: 4, meta: "6-8", descanso: 120 },
                    { id: "leg-press", nome: "Leg Press", sets: 4, meta: "10-12", descanso: 90 },
                    { id: "mesa-flexora", nome: "Mesa Flexora", sets: 3, meta: "10-12", descanso: 75 },
                    { id: "panturrilha", nome: "Panturrilha em Pé", sets: 4, meta: "12-15", descanso: 60 },
                ],
            },
            {
                id: "treino-d",
                nome: "Treino D - Ombros e Abdômen",
                tipo: "funcional",
                nivel: "intermediario",
                duracao: 50,
                tags: ["Ombro", "Core"],
                obs: "Controle de tronco e estabilidade.",
                exercises: [
                    { id: "desenvolvimento", nome: "Desenvolvimento Militar", sets: 4, meta: "8-10", descanso: 90 },
                    { id: "elevacao-lateral", nome: "Elevação Lateral", sets: 3, meta: "12-15", descanso: 60 },
                    { id: "prancha", nome: "Prancha", sets: 3, meta: "30-60s", descanso: 45 },
                    { id: "abdominal", nome: "Abdominal Máquina", sets: 3, meta: "12-15", descanso: 45 },
                ],
            },
        ]);
    }

    function safeParse(value, fallback) {
        try {
            const parsed = JSON.parse(value);
            return parsed === null ? fallback : parsed;
        } catch (error) {
            return fallback;
        }
    }

    function canUseStorage() {
        return typeof localStorage !== "undefined";
    }

    function loadUsers() {
        if (!canUseStorage()) {
            return [];
        }

        const users = safeParse(localStorage.getItem(USERS_KEY), []);
        return Array.isArray(users) ? users.map(normalizeUserShape) : [];
    }

    function saveUsers(users) {
        if (canUseStorage()) {
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
        }
    }

    function getSessionEmail() {
        if (!canUseStorage()) {
            return "";
        }

        const raw = localStorage.getItem(SESSION_KEY);
        const parsed = safeParse(raw, raw);

        if (typeof parsed === "string") {
            return normalizeEmail(parsed);
        }

        return normalizeEmail(parsed && (parsed.email || parsed.id));
    }

    function setSession(email) {
        if (canUseStorage()) {
            localStorage.setItem(SESSION_KEY, normalizeEmail(email));
        }
    }

    function clearSession() {
        if (canUseStorage()) {
            localStorage.removeItem(SESSION_KEY);
            localStorage.removeItem(SELECTED_WORKOUT_KEY);
        }
    }

    function getCurrentUser(users) {
        const email = getSessionEmail();
        return (users || loadUsers()).find((user) => normalizeEmail(user.email) === email) || null;
    }

    function saveUser(updatedUser, previousEmail) {
        const users = loadUsers();
        const targetEmail = normalizeEmail(previousEmail || updatedUser.email);
        const index = users.findIndex((user) => normalizeEmail(user.email) === targetEmail);

        if (index >= 0) {
            users[index] = normalizeUserShape(updatedUser);
            saveUsers(users);
        }

        return users[index] || updatedUser;
    }

    function normalizeUserShape(user) {
        const primaryGoal = user.objetivo || (user.profile && user.profile.objetivos && user.profile.objetivos[0]) || "saude";

        return {
            id: user.id || createId("user"),
            nome: cleanText(user.nome || "Usuário EasyWorkout"),
            email: normalizeEmail(user.email),
            senha: String(user.senha || ""),
            nascimento: user.nascimento || "",
            genero: user.genero || "nao-informar",
            nivel: user.nivel || (user.profile && user.profile.nivel) || "iniciante",
            objetivo: primaryGoal,
            dias: String(user.dias || (user.profile && user.profile.dias) || "3"),
            createdAt: user.createdAt || new Date().toISOString(),
            profile: {
                altura: user.profile && user.profile.altura ? String(user.profile.altura) : "",
                peso: user.profile && user.profile.peso ? String(user.profile.peso) : "",
                duracao: String((user.profile && user.profile.duracao) || "60"),
                dias: String((user.profile && user.profile.dias) || user.dias || "3"),
                nivel: (user.profile && user.profile.nivel) || user.nivel || "iniciante",
                objetivos: Array.isArray(user.profile && user.profile.objetivos) && user.profile.objetivos.length
                    ? user.profile.objetivos
                    : [primaryGoal],
                equipamentos: Array.isArray(user.profile && user.profile.equipamentos)
                    ? user.profile.equipamentos
                    : ["halteres", "corpopeso"],
            },
            workouts: Array.isArray(user.workouts) && user.workouts.length ? user.workouts : getDefaultWorkouts(),
            history: Array.isArray(user.history) ? user.history : [],
        };
    }

    function validateRegistration(data, users, today) {
        const errors = {};
        const email = normalizeEmail(data.email);
        const password = String(data.senha || "");
        const birthDate = parseLocalDate(data.nascimento);

        if (cleanText(data.nome).length < 3) {
            errors.nome = "Informe seu nome completo.";
        }

        if (!email) {
            errors.email = "Informe seu e-mail.";
        } else if (!isValidEmail(email)) {
            errors.email = "Informe um e-mail válido.";
        } else if ((users || []).some((user) => normalizeEmail(user.email) === email)) {
            errors.email = "Este e-mail já está cadastrado.";
        }

        if (!password) {
            errors.senha = "Informe uma senha.";
        } else if (password.length < 8) {
            errors.senha = "A senha deve ter pelo menos 8 caracteres.";
        }

        if (!data.nascimento || !birthDate) {
            errors.nascimento = "Informe uma data de nascimento válida.";
        } else if (isFutureDate(data.nascimento, today || new Date())) {
            errors.nascimento = "A data de nascimento não pode ser futura.";
        } else if (calculateAge(data.nascimento, today || new Date()) < 12) {
            errors.nascimento = "Cadastro permitido para usuários a partir de 12 anos.";
        }

        if (!genders.includes(data.genero)) {
            errors.genero = "Selecione uma opção de gênero.";
        }

        if (!levels[data.nivel]) {
            errors.nivel = "Selecione seu nível de aptidão.";
        }

        if (!goals[data.objetivo]) {
            errors.objetivo = "Selecione seu objetivo principal.";
        }

        if (!["2", "3", "4", "5", "6"].includes(String(data.dias || ""))) {
            errors.dias = "Selecione sua disponibilidade semanal.";
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors,
        };
    }

    function registerUser(data, users, now) {
        const createdAt = now || new Date();
        const user = normalizeUserShape({
            id: createId("user", createdAt),
            nome: cleanText(data.nome),
            email: normalizeEmail(data.email),
            senha: String(data.senha || ""),
            nascimento: data.nascimento,
            genero: data.genero,
            nivel: data.nivel,
            objetivo: data.objetivo,
            dias: String(data.dias),
            createdAt: createdAt.toISOString(),
            profile: {
                altura: "",
                peso: "",
                duracao: "60",
                dias: String(data.dias),
                nivel: data.nivel,
                objetivos: [data.objetivo],
                equipamentos: ["halteres", "corpopeso"],
            },
            workouts: getDefaultWorkouts(),
            history: [],
        });

        return [...(users || []), user];
    }

    function validateLogin(data, users) {
        const errors = {};
        const email = normalizeEmail(data.email);

        if (!email) {
            errors.email = "Informe seu e-mail.";
        } else if (!isValidEmail(email)) {
            errors.email = "Informe um e-mail válido.";
        }

        if (!data.senha) {
            errors.senha = "Informe sua senha.";
        }

        if (Object.keys(errors).length === 0) {
            const user = (users || []).find((candidate) => normalizeEmail(candidate.email) === email);
            if (!user || String(user.senha) !== String(data.senha)) {
                errors.form = "E-mail ou senha inválidos.";
            }
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors,
        };
    }

    function validateProfile(data, users, currentEmail, today) {
        const errors = {};
        const email = normalizeEmail(data.email);
        const height = toNumber(data.altura);
        const weight = toNumber(data.peso);

        if (cleanText(data.nome).length < 3) {
            errors.nome = "Informe seu nome completo.";
        }

        if (!email) {
            errors.email = "Informe seu e-mail.";
        } else if (!isValidEmail(email)) {
            errors.email = "Informe um e-mail válido.";
        } else if ((users || []).some((user) => normalizeEmail(user.email) === email && normalizeEmail(user.email) !== normalizeEmail(currentEmail))) {
            errors.email = "Este e-mail já está cadastrado.";
        }

        if (!data.nascimento || !parseLocalDate(data.nascimento)) {
            errors.nascimento = "Informe uma data válida.";
        } else if (isFutureDate(data.nascimento, today || new Date())) {
            errors.nascimento = "A data de nascimento não pode ser futura.";
        }

        if (!genders.includes(data.genero)) {
            errors.genero = "Selecione uma opção de gênero.";
        }

        if (data.altura && (Number.isNaN(height) || height < 100 || height > 250)) {
            errors.altura = "Altura deve ficar entre 100 e 250 cm.";
        }

        if (data.peso && (Number.isNaN(weight) || weight < 30 || weight > 300)) {
            errors.peso = "Peso deve ficar entre 30 e 300 kg.";
        }

        if (!levels[data.nivel]) {
            errors.nivel = "Selecione seu nível.";
        }

        if (!["2", "3", "4", "5", "6"].includes(String(data.dias || ""))) {
            errors.dias = "Selecione os dias por semana.";
        }

        if (!["30", "45", "60", "90"].includes(String(data.duracao || ""))) {
            errors.duracao = "Selecione a duração da sessão.";
        }

        if (!Array.isArray(data.objetivos) || data.objetivos.length === 0) {
            errors.objetivo = "Selecione pelo menos um objetivo.";
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors,
        };
    }

    function calculateImc(heightCm, weightKg) {
        const height = toNumber(heightCm);
        const weight = toNumber(weightKg);

        if (!height || !weight || Number.isNaN(height) || Number.isNaN(weight)) {
            return null;
        }

        const value = weight / ((height / 100) ** 2);
        let category = "Peso normal";

        if (value < 18.5) {
            category = "Abaixo do peso";
        } else if (value >= 30) {
            category = "Obesidade";
        } else if (value >= 25) {
            category = "Sobrepeso";
        }

        return {
            value: value.toFixed(1),
            category,
            position: clamp(((value - 12) / 28) * 100, 0, 100),
        };
    }

    function validateWorkout(data) {
        const errors = {};
        const duration = toNumber(data.duracao);

        if (cleanText(data.nome).length < 3) {
            errors.nome = "Informe o nome do treino.";
        }

        if (!workoutTypes[data.tipo]) {
            errors.tipo = "Selecione o tipo do treino.";
        }

        if (Number.isNaN(duration) || duration < 10 || duration > 180) {
            errors.duracao = "Duração deve ficar entre 10 e 180 minutos.";
        }

        if (!levels[data.nivel]) {
            errors.nivel = "Selecione o nível do treino.";
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors,
        };
    }

    function titleCase(value) {
        const text = cleanText(value);
        return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
    }

    function extractTags(obs, fallbackType) {
        const tags = cleanText(obs)
            .split(/[;,]/)
            .map(titleCase)
            .filter(Boolean)
            .slice(0, 4);

        return tags.length ? tags : [workoutTypes[fallbackType] || "Treino"];
    }

    function createWorkout(data, now) {
        const createdAt = now || new Date();
        const tags = extractTags(data.obs, data.tipo);

        return {
            id: createId("workout", createdAt),
            nome: cleanText(data.nome),
            tipo: data.tipo,
            nivel: data.nivel,
            duracao: Number(data.duracao),
            tags,
            obs: cleanText(data.obs),
            createdAt: createdAt.toISOString(),
            exercises: [
                {
                    id: createId("exercise", createdAt),
                    nome: "Exercício livre",
                    sets: 3,
                    meta: "10-12",
                    descanso: 60,
                },
            ],
        };
    }

    function getWorkoutSetTotal(workout) {
        return (workout.exercises || []).reduce((total, exercise) => total + Number(exercise.sets || 0), 0);
    }

    function normalizeEntriesForExercise(entries, exercise) {
        const sets = [];
        const raw = entries && entries[exercise.id];

        for (let index = 0; index < Number(exercise.sets || 0); index += 1) {
            const entry = raw && raw[index] ? raw[index] : {};
            sets.push({
                carga: Math.max(0, toNumber(entry.carga) || 0),
                reps: Math.max(0, toNumber(entry.reps) || 0),
            });
        }

        return sets;
    }

    function calculateSessionStats(workout, entries) {
        let completedSets = 0;
        let completedExercises = 0;
        let volume = 0;
        const records = [];

        (workout.exercises || []).forEach((exercise) => {
            const sets = normalizeEntriesForExercise(entries, exercise);
            const completed = sets.filter((set) => set.carga > 0 && set.reps > 0);
            let maxLoad = 0;
            let maxReps = 0;

            completed.forEach((set) => {
                completedSets += 1;
                volume += set.carga * set.reps;
                maxLoad = Math.max(maxLoad, set.carga);
                maxReps = Math.max(maxReps, set.reps);
            });

            if (completed.length === Number(exercise.sets || 0) && completed.length > 0) {
                completedExercises += 1;
            }

            if (maxLoad > 0) {
                records.push({
                    exerciseId: exercise.id,
                    exerciseName: exercise.nome,
                    maxLoad,
                    maxReps,
                });
            }
        });

        return {
            completedSets,
            totalSets: getWorkoutSetTotal(workout),
            completedExercises,
            totalExercises: (workout.exercises || []).length,
            volume,
            records,
        };
    }

    function finishWorkout(workout, entries, startedAt, finishedAt) {
        const start = startedAt ? new Date(startedAt) : new Date();
        const finish = finishedAt ? new Date(finishedAt) : new Date();
        const stats = calculateSessionStats(workout, entries);

        return {
            id: createId("session", finish),
            workoutId: workout.id,
            workoutName: workout.nome,
            type: workout.tipo,
            date: finish.toISOString(),
            startedAt: start.toISOString(),
            finishedAt: finish.toISOString(),
            durationMinutes: Math.max(1, Math.round((finish - start) / 60000)),
            entries,
            completedSets: stats.completedSets,
            totalSets: stats.totalSets,
            completedExercises: stats.completedExercises,
            totalExercises: stats.totalExercises,
            volume: stats.volume,
            records: stats.records,
        };
    }

    function getPersonalRecords(history) {
        const byExercise = new Map();

        (history || []).forEach((session) => {
            (session.records || []).forEach((record) => {
                const current = byExercise.get(record.exerciseName);
                if (!current || record.maxLoad > current.maxLoad) {
                    byExercise.set(record.exerciseName, {
                        exerciseName: record.exerciseName,
                        maxLoad: record.maxLoad,
                        date: session.date,
                        workoutName: session.workoutName,
                    });
                }
            });
        });

        return Array.from(byExercise.values()).sort((a, b) => b.maxLoad - a.maxLoad);
    }

    function getProgressSummary(user, now) {
        const reference = now || new Date();
        const history = user.history || [];
        const sameMonth = history.filter((session) => {
            const date = new Date(session.date);
            return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
        });
        const volume = sameMonth.reduce((total, session) => total + Number(session.volume || 0), 0);
        const records = getPersonalRecords(sameMonth);
        const planned = Number(user.profile && user.profile.dias ? user.profile.dias : user.dias || 3) * 4;

        return {
            monthSessions: sameMonth.length,
            plannedSessions: planned,
            monthVolumeKg: volume,
            monthVolumeTons: (volume / 1000).toFixed(1),
            streak: calculateStreak(history, reference),
            recordCount: records.length,
            records,
        };
    }

    function calculateStreak(history, now) {
        const dates = new Set((history || []).map((session) => new Date(session.date).toISOString().slice(0, 10)));
        const cursor = startOfDay(now || new Date());
        let streak = 0;

        while (dates.has(cursor.toISOString().slice(0, 10))) {
            streak += 1;
            cursor.setDate(cursor.getDate() - 1);
        }

        return streak;
    }

    function getBadgeClass(type) {
        if (type === "forca") {
            return "badge-blue";
        }
        if (type === "funcional" || type === "condicionamento") {
            return "badge-warn";
        }
        return "badge-green";
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function escapeCssIdentifier(value) {
        if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
            return CSS.escape(String(value));
        }

        return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    }

    function getPageName() {
        if (typeof window === "undefined") {
            return "";
        }

        return window.location.pathname.split("/").pop() || "index.html";
    }

    function isProtectedPage(pageName) {
        return ["gestao-treino.html", "exibicao-treino.html", "progressos.html", "informacoes-pessoais.html"].includes(pageName);
    }

    function initPage() {
        const pageName = getPageName();
        const users = loadUsers();

        bindLogout();

        if (isProtectedPage(pageName)) {
            const user = getCurrentUser(users);
            if (!user) {
                window.location.href = "login.html";
                return;
            }

            if (pageName === "gestao-treino.html") {
                initWorkoutManagement(user);
            } else if (pageName === "exibicao-treino.html") {
                initWorkoutExecution(user);
            } else if (pageName === "progressos.html") {
                initProgressPage(user);
            } else if (pageName === "informacoes-pessoais.html") {
                initProfilePage(user);
            }
        }

        if (pageName === "cadastro.html") {
            initRegistrationPage();
        }

        if (pageName === "login.html") {
            initLoginPage();
        }
    }

    function bindLogout() {
        document.querySelectorAll(".sidebar-footer a").forEach((link) => {
            link.addEventListener("click", (event) => {
                event.preventDefault();
                clearSession();
                window.location.href = "index.html";
            });
        });
    }

    function readForm(form) {
        return Object.fromEntries(new FormData(form).entries());
    }

    function clearErrors(rootElement) {
        rootElement.querySelectorAll(".field-error").forEach((element) => element.remove());
        rootElement.querySelectorAll(".is-invalid").forEach((element) => element.classList.remove("is-invalid"));
    }

    function setFieldError(rootElement, name, message) {
        const field = rootElement.querySelector(`[name="${escapeCssIdentifier(name)}"]`);

        if (!field) {
            return;
        }

        field.classList.add("is-invalid");
        const holder = field.closest(".form-group, .info-row, label") || field.parentElement;
        const error = document.createElement("span");
        error.className = "field-error";
        error.textContent = message;
        holder.appendChild(error);
    }

    function showMessage(target, message, type) {
        if (!target) {
            return;
        }

        const holder = target.matches("form, .details-form, .app-content") ? target : target.parentElement;
        let messageElement = holder.querySelector(":scope > .form-message");

        if (!messageElement) {
            messageElement = document.createElement("div");
            messageElement.className = "form-message";
            holder.prepend(messageElement);
        }

        messageElement.className = `form-message form-message--${type || "info"}`;
        messageElement.textContent = message;
    }

    function showStoredNotice(rootElement) {
        if (typeof sessionStorage === "undefined") {
            return;
        }

        const notice = sessionStorage.getItem("easyWorkoutNotice");
        if (notice) {
            showMessage(rootElement, notice, "success");
            sessionStorage.removeItem("easyWorkoutNotice");
        }
    }

    function setNotice(message) {
        if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem("easyWorkoutNotice", message);
        }
    }

    function initRegistrationPage() {
        const form = document.querySelector(".register-form");
        if (!form) {
            return;
        }

        form.noValidate = true;
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            clearErrors(form);

            const users = loadUsers();
            const data = readForm(form);
            const validation = validateRegistration(data, users, new Date());

            if (!validation.valid) {
                Object.entries(validation.errors).forEach(([field, message]) => setFieldError(form, field, message));
                showMessage(form, "Revise os campos destacados para continuar.", "error");
                return;
            }

            saveUsers(registerUser(data, users, new Date()));
            setNotice("Cadastro criado com sucesso. Faça login para continuar.");
            window.location.href = "login.html";
        });
    }

    function initLoginPage() {
        const form = document.querySelector(".login-form");
        if (!form) {
            return;
        }

        showStoredNotice(form);
        form.noValidate = true;
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            clearErrors(form);

            const users = loadUsers();
            const data = readForm(form);
            const validation = validateLogin(data, users);

            if (!validation.valid) {
                Object.entries(validation.errors).forEach(([field, message]) => {
                    if (field === "form") {
                        showMessage(form, message, "error");
                    } else {
                        setFieldError(form, field, message);
                    }
                });

                if (!validation.errors.form) {
                    showMessage(form, "Revise os campos destacados para continuar.", "error");
                }
                return;
            }

            setSession(data.email);
            window.location.href = "gestao-treino.html";
        });
    }

    function initProfilePage(user) {
        const form = document.querySelector("#form-pessoal");
        if (!form) {
            return;
        }

        fillProfileForm(form, user);
        updateProfileHeader(user);
        updateImcDisplay(form);
        showStoredNotice(document.querySelector(".app-content"));

        ["altura", "peso"].forEach((name) => {
            const field = form.querySelector(`[name="${name}"]`);
            if (field) {
                field.addEventListener("input", () => updateImcDisplay(form));
            }
        });

        form.noValidate = true;
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            clearErrors(form);

            const users = loadUsers();
            const currentEmail = user.email;
            const data = readProfileForm(form);
            const validation = validateProfile(data, users, currentEmail, new Date());

            if (!validation.valid) {
                Object.entries(validation.errors).forEach(([field, message]) => setFieldError(form, field, message));
                showMessage(form, "Revise os campos destacados antes de salvar.", "error");
                return;
            }

            user.nome = cleanText(data.nome);
            user.email = normalizeEmail(data.email);
            user.nascimento = data.nascimento;
            user.genero = data.genero;
            user.nivel = data.nivel;
            user.dias = String(data.dias);
            user.objetivo = data.objetivos[0];
            user.profile = {
                altura: data.altura,
                peso: data.peso,
                duracao: data.duracao,
                dias: String(data.dias),
                nivel: data.nivel,
                objetivos: data.objetivos,
                equipamentos: data.equipamentos,
            };

            saveUser(user, currentEmail);
            setSession(user.email);
            updateProfileHeader(user);
            updateImcDisplay(form);
            showMessage(form, "Informações salvas com sucesso.", "success");
        });
    }

    function readProfileForm(form) {
        const data = readForm(form);
        data.objetivos = Array.from(form.querySelectorAll('input[name="objetivo"]:checked')).map((field) => field.value);
        data.equipamentos = Array.from(form.querySelectorAll('input[name="equip"]:checked')).map((field) => field.value);
        return data;
    }

    function fillProfileForm(form, user) {
        const values = {
            nome: user.nome,
            email: user.email,
            nascimento: user.nascimento,
            genero: user.genero,
            altura: user.profile.altura,
            peso: user.profile.peso,
            nivel: user.profile.nivel,
            dias: user.profile.dias,
            duracao: user.profile.duracao,
        };

        Object.entries(values).forEach(([name, value]) => {
            const field = form.querySelector(`[name="${name}"]`);
            if (field) {
                field.value = value || "";
            }
        });

        form.querySelectorAll('input[name="objetivo"]').forEach((field) => {
            field.checked = user.profile.objetivos.includes(field.value);
        });

        form.querySelectorAll('input[name="equip"]').forEach((field) => {
            field.checked = user.profile.equipamentos.includes(field.value);
        });
    }

    function updateProfileHeader(user) {
        const name = document.querySelector(".profile-info h2");
        const meta = document.querySelector(".profile-info p");

        if (name) {
            name.textContent = user.nome;
        }

        if (meta) {
            const createdAt = new Date(user.createdAt);
            const month = createdAt.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
            meta.textContent = `Membro desde ${month} · Nível ${levels[user.profile.nivel] || levels[user.nivel]}`;
        }
    }

    function updateImcDisplay(form) {
        const height = form.querySelector('[name="altura"]')?.value;
        const weight = form.querySelector('[name="peso"]')?.value;
        const imc = calculateImc(height, weight);
        const marker = form.querySelector(".imc-marker");
        const text = form.querySelector(".imc-bar + p");

        if (marker) {
            marker.style.setProperty("--pos", `${imc ? imc.position : 0}%`);
        }

        if (text) {
            text.innerHTML = imc
                ? `IMC atual: <strong>${imc.value}</strong> — ${imc.category}`
                : "IMC atual: informe altura e peso.";
        }
    }

    function initWorkoutManagement(user) {
        renderWorkoutStats(user);
        renderWorkoutCards(user);
        renderPlanner(user);
        bindWorkoutCreation(user);
        showStoredNotice(document.querySelector(".app-content"));
    }

    function renderWorkoutStats(user) {
        const grid = document.querySelector(".stats-grid");
        if (!grid) {
            return;
        }

        const workouts = user.workouts || [];
        const exerciseCount = workouts.reduce((total, workout) => total + (workout.exercises || []).length, 0);
        const last = (user.history || [])[0];

        grid.innerHTML = `
            <div class="stat-card">
                <div class="stat-label">Treinos cadastrados</div>
                <div class="stat-value accent">${workouts.length}</div>
                <div class="stat-unit">divisões ativas</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Exercícios no total</div>
                <div class="stat-value">${exerciseCount}</div>
                <div class="stat-unit">entre todos os treinos</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Frequência semanal</div>
                <div class="stat-value warning">${escapeHtml(user.profile.dias || user.dias)}</div>
                <div class="stat-unit">dias planejados</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Último treino</div>
                <div class="stat-value blue" style="font-size:1.2rem;padding-top:6px;">${last ? "Registrado" : "Nenhum"}</div>
                <div class="stat-unit">${last ? escapeHtml(last.workoutName) : "Comece um treino"}</div>
            </div>
        `;
    }

    function renderWorkoutCards(user) {
        const grid = document.querySelector(".workouts-grid");
        const startLink = document.querySelector('.app-topbar a[href="exibicao-treino.html"]');

        if (!grid) {
            return;
        }

        if (!user.workouts.length) {
            grid.innerHTML = '<div class="empty-state">Nenhum treino cadastrado ainda.</div>';
            return;
        }

        grid.innerHTML = user.workouts.map((workout) => `
            <article class="workout-card">
                <div class="workout-card-header">
                    <h3>${escapeHtml(workout.nome)}</h3>
                    <span class="badge ${getBadgeClass(workout.tipo)}">${escapeHtml(workoutTypes[workout.tipo] || workout.tipo)}</span>
                </div>
                <div class="workout-meta">
                    <span>⏱ ${Number(workout.duracao || 0)} min</span>
                    <span>🔁 ${(workout.exercises || []).length} exercícios</span>
                </div>
                <div class="workout-tags">
                    ${(workout.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
                </div>
                <a href="exibicao-treino.html" class="btn btn-primary js-execute-workout" data-workout-id="${escapeHtml(workout.id)}" style="margin-top:4px;">Executar</a>
            </article>
        `).join("");

        if (startLink && user.workouts[0]) {
            startLink.addEventListener("click", () => {
                localStorage.setItem(SELECTED_WORKOUT_KEY, user.workouts[0].id);
            });
        }

        grid.querySelectorAll(".js-execute-workout").forEach((link) => {
            link.addEventListener("click", () => {
                localStorage.setItem(SELECTED_WORKOUT_KEY, link.dataset.workoutId);
            });
        });
    }

    function renderPlanner(user) {
        const planner = document.querySelector(".planner-grid");
        if (!planner) {
            return;
        }

        const trainingDays = [0, 2, 3, 5, 1, 4].slice(0, Number(user.profile.dias || user.dias || 3));
        const todayIndex = (new Date().getDay() + 6) % 7;

        planner.innerHTML = weekDays.map((day, index) => {
            const workoutIndex = trainingDays.indexOf(index);
            const workout = workoutIndex >= 0 ? user.workouts[workoutIndex % user.workouts.length] : null;

            return `
                <div class="planner-day ${index === todayIndex ? "today" : ""}">
                    <span class="day-name">${day}</span>
                    ${workout
                        ? `<span class="day-workout">${escapeHtml(shortWorkoutName(workout.nome))}</span>`
                        : '<span class="day-rest">Descanso</span>'}
                </div>
            `;
        }).join("");
    }

    function shortWorkoutName(name) {
        return cleanText(name).split("-")[0].trim() || name;
    }

    function bindWorkoutCreation(user) {
        const details = document.querySelector(".details-form");
        const button = details && details.querySelector('button[type="submit"]');

        if (!details || !button) {
            return;
        }

        button.addEventListener("click", (event) => {
            event.preventDefault();
            clearErrors(details);

            const data = {
                nome: document.querySelector("#novo-nome")?.value,
                tipo: document.querySelector("#novo-tipo")?.value,
                duracao: document.querySelector("#novo-duracao")?.value,
                nivel: document.querySelector("#novo-nivel")?.value,
                obs: document.querySelector("#novo-obs")?.value,
            };
            const validation = validateWorkout(data);

            if (!validation.valid) {
                Object.entries(validation.errors).forEach(([field, message]) => setFieldError(details, field, message));
                showMessage(details, "Revise os campos destacados para salvar o treino.", "error");
                return;
            }

            user.workouts.push(createWorkout(data, new Date()));
            saveUser(user);
            ["#novo-nome", "#novo-tipo", "#novo-duracao", "#novo-nivel", "#novo-obs"].forEach((selector) => {
                const field = document.querySelector(selector);
                if (field) {
                    field.value = "";
                }
            });
            details.open = false;
            renderWorkoutStats(user);
            renderWorkoutCards(user);
            renderPlanner(user);
            showMessage(document.querySelector(".app-content"), "Treino criado com sucesso.", "success");
        });
    }

    function initWorkoutExecution(user) {
        const workout = getSelectedWorkout(user);
        const content = document.querySelector(".app-content");

        if (!workout) {
            if (content) {
                content.innerHTML = '<div class="empty-state">Crie um treino antes de iniciar uma execução.</div>';
            }
            return;
        }

        const startedAt = new Date();
        renderExecutionWorkout(workout);
        startTimer(startedAt);

        const exerciseList = document.querySelector(".exercise-list");
        if (exerciseList) {
            exerciseList.addEventListener("input", () => renderExecutionStats(workout, collectEntries(workout)));
        }

        renderExecutionStats(workout, collectEntries(workout));
        bindFinishWorkout(user, workout, startedAt);
    }

    function getSelectedWorkout(user) {
        const selected = canUseStorage() ? localStorage.getItem(SELECTED_WORKOUT_KEY) : "";
        return (user.workouts || []).find((workout) => workout.id === selected) || (user.workouts || [])[0] || null;
    }

    function renderExecutionWorkout(workout) {
        const title = document.querySelector(".workout-banner h2");
        const meta = document.querySelector(".workout-banner-meta");
        const list = document.querySelector(".exercise-list");
        const badge = document.querySelector(".section-header .badge");

        if (title) {
            title.textContent = workout.nome;
        }

        if (meta) {
            meta.innerHTML = `
                <span>⏱ Duração estimada: ${Number(workout.duracao || 0)} min</span>
                <span>🔁 ${(workout.exercises || []).length} exercícios</span>
                <span>🏋️ ${escapeHtml(workoutTypes[workout.tipo] || workout.tipo)}</span>
            `;
        }

        if (badge) {
            badge.className = `badge ${getBadgeClass(workout.tipo)}`;
            badge.textContent = shortWorkoutName(workout.nome);
        }

        if (!list) {
            return;
        }

        list.innerHTML = (workout.exercises || []).map((exercise, index) => `
            <li>
                <details class="exercise-item" ${index === 0 ? "open" : ""}>
                    <summary>
                        <span class="exercise-number">${index + 1}</span>
                        <div class="exercise-info">
                            <strong>${escapeHtml(exercise.nome)}</strong>
                            <span>${Number(exercise.sets)} séries · ${escapeHtml(exercise.meta)} reps · Descanso: ${Number(exercise.descanso)}s</span>
                        </div>
                        <span class="exercise-done" data-exercise-done="${escapeHtml(exercise.id)}">0 / ${Number(exercise.sets)} séries</span>
                    </summary>
                    <table class="sets-table">
                        <thead>
                            <tr>
                                <th>Série</th>
                                <th>Carga (kg)</th>
                                <th>Reps</th>
                                <th>Meta</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Array.from({ length: Number(exercise.sets || 0) }, (_, setIndex) => `
                                <tr>
                                    <td>${setIndex + 1}</td>
                                    <td><input type="number" placeholder="0" min="0" data-exercise-id="${escapeHtml(exercise.id)}" data-entry="carga" data-set-index="${setIndex}"></td>
                                    <td><input type="number" placeholder="0" min="0" data-exercise-id="${escapeHtml(exercise.id)}" data-entry="reps" data-set-index="${setIndex}"></td>
                                    <td>${escapeHtml(exercise.meta)}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </details>
            </li>
        `).join("");
    }

    function startTimer(startedAt) {
        const timer = document.querySelector(".timer-display");
        if (!timer) {
            return;
        }

        function tick() {
            const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
            const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
            const seconds = String(elapsed % 60).padStart(2, "0");
            timer.textContent = `${minutes}:${seconds}`;
        }

        tick();
        window.setInterval(tick, 1000);
    }

    function collectEntries(workout) {
        const entries = {};

        (workout.exercises || []).forEach((exercise) => {
            entries[exercise.id] = Array.from({ length: Number(exercise.sets || 0) }, () => ({ carga: 0, reps: 0 }));
        });

        document.querySelectorAll("[data-exercise-id][data-entry]").forEach((field) => {
            const exerciseId = field.dataset.exerciseId;
            const setIndex = Number(field.dataset.setIndex);
            const entry = field.dataset.entry;

            if (entries[exerciseId] && entries[exerciseId][setIndex]) {
                entries[exerciseId][setIndex][entry] = Math.max(0, toNumber(field.value) || 0);
            }
        });

        return entries;
    }

    function renderExecutionStats(workout, entries) {
        const stats = calculateSessionStats(workout, entries);
        const grid = document.querySelector(".stats-grid");

        if (grid) {
            grid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-label">Séries concluídas</div>
                    <div class="stat-value accent">${stats.completedSets}</div>
                    <div class="stat-unit">de ${stats.totalSets} séries</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Exercícios feitos</div>
                    <div class="stat-value">${stats.completedExercises}</div>
                    <div class="stat-unit">de ${stats.totalExercises}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Volume total</div>
                    <div class="stat-value blue">${stats.volume}</div>
                    <div class="stat-unit">kg registrados</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Descanso sugerido</div>
                    <div class="stat-value warning" style="font-size:1.3rem;padding-top:6px;">${getSuggestedRest(workout)}s</div>
                    <div class="stat-unit">entre séries</div>
                </div>
            `;
        }

        (workout.exercises || []).forEach((exercise) => {
            const done = normalizeEntriesForExercise(entries, exercise).filter((set) => set.carga > 0 && set.reps > 0).length;
            const label = document.querySelector(`[data-exercise-done="${escapeCssIdentifier(exercise.id)}"]`);
            if (label) {
                label.textContent = `${done} / ${Number(exercise.sets)} séries`;
            }
        });
    }

    function getSuggestedRest(workout) {
        const rests = (workout.exercises || []).map((exercise) => Number(exercise.descanso || 60));
        if (!rests.length) {
            return 60;
        }
        return Math.round(rests.reduce((total, rest) => total + rest, 0) / rests.length);
    }

    function bindFinishWorkout(user, workout, startedAt) {
        const finishLink = Array.from(document.querySelectorAll("a")).find((link) => link.textContent.trim().includes("Finalizar"));
        if (!finishLink) {
            return;
        }

        finishLink.addEventListener("click", (event) => {
            event.preventDefault();
            const entries = collectEntries(workout);
            const stats = calculateSessionStats(workout, entries);

            if (stats.completedSets === 0) {
                showMessage(document.querySelector(".app-content"), "Registre ao menos uma série com carga e repetições antes de finalizar.", "error");
                return;
            }

            user.history = [finishWorkout(workout, entries, startedAt, new Date()), ...(user.history || [])];
            saveUser(user);
            setNotice("Treino finalizado e salvo no histórico.");
            window.location.href = "progressos.html";
        });
    }

    function initProgressPage(user) {
        showStoredNotice(document.querySelector(".app-content"));
        renderProgressStats(user);
        renderProgressRecords(user);
        renderProgressHistory(user);
        renderProgressCharts(user);
        bindProgressTabs();
    }

    function renderProgressStats(user) {
        const grid = document.querySelector(".stats-grid");
        if (!grid) {
            return;
        }

        const summary = getProgressSummary(user, new Date());
        grid.innerHTML = `
            <div class="stat-card">
                <div class="stat-label">Treinos este mês</div>
                <div class="stat-value accent">${summary.monthSessions}</div>
                <div class="stat-unit">de ${summary.plannedSessions} planejados</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Volume total (mês)</div>
                <div class="stat-value">${summary.monthVolumeTons}</div>
                <div class="stat-unit">toneladas movidas</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Sequência atual</div>
                <div class="stat-value warning">${summary.streak}</div>
                <div class="stat-unit">dias consecutivos</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Recordes registrados</div>
                <div class="stat-value blue">${summary.recordCount}</div>
                <div class="stat-unit">cargas máximas salvas</div>
            </div>
        `;
    }

    function renderProgressRecords(user) {
        const grid = document.querySelector(".records-grid");
        if (!grid) {
            return;
        }

        const records = getPersonalRecords(user.history || []);

        if (!records.length) {
            grid.innerHTML = '<div class="empty-state">Finalize um treino para gerar seus primeiros recordes.</div>';
            return;
        }

        grid.innerHTML = records.slice(0, 6).map((record) => `
            <div class="record-card">
                <div class="record-exercise">${escapeHtml(record.exerciseName)}</div>
                <div class="record-value">${Number(record.maxLoad)} kg</div>
                <div class="record-date">${formatDate(record.date)} · ${escapeHtml(record.workoutName)}</div>
            </div>
        `).join("");
    }

    function renderProgressHistory(user) {
        const defaultPanel = document.querySelector("#visao-geral");
        if (!defaultPanel) {
            return;
        }

        const cards = defaultPanel.querySelectorAll(".info-card");
        const card = cards[cards.length - 1];
        if (!card) {
            return;
        }

        const sessions = (user.history || []).slice(0, 12);
        card.innerHTML = `
            <h3>Histórico de treinos</h3>
            ${sessions.length
                ? `<div style="display:flex;flex-wrap:wrap;gap:8px;padding-top:4px;">
                    ${sessions.map((session) => `<span class="badge ${getBadgeClass(session.type)}">${formatDate(session.date)} — ${escapeHtml(shortWorkoutName(session.workoutName))}</span>`).join("")}
                </div>`
                : '<div class="empty-state">Nenhum treino finalizado ainda.</div>'}
        `;
    }

    function renderProgressCharts(user) {
        const history = user.history || [];
        const firstChart = document.querySelector("#visao-geral .bar-chart");

        if (firstChart) {
            const weeks = getLastWeekCounts(history);
            const max = Math.max(...weeks, 1);
            firstChart.innerHTML = weeks.map((count, index) => `
                <div class="bar-col">
                    <div class="bar" style="--h:${Math.max(6, (count / max) * 100)}%;" role="img" aria-label="${count} treinos na semana ${index + 1}"></div>
                    <span class="bar-label">S${index + 1}</span>
                </div>
            `).join("");
        }

        const exercisePanel = document.querySelector("#exercicios");
        const records = getPersonalRecords(history).slice(0, 2);
        if (exercisePanel && records.length) {
            const cards = exercisePanel.querySelectorAll(".info-card h3");
            records.forEach((record, index) => {
                if (cards[index]) {
                    cards[index].textContent = `${record.exerciseName} — melhor carga`;
                }
            });
        }
    }

    function getLastWeekCounts(history) {
        const counts = Array.from({ length: 8 }, () => 0);
        const now = startOfDay(new Date());

        (history || []).forEach((session) => {
            const date = startOfDay(new Date(session.date));
            const diffDays = Math.floor((now - date) / 86400000);
            const weekIndex = 7 - Math.floor(diffDays / 7);
            if (weekIndex >= 0 && weekIndex < 8) {
                counts[weekIndex] += 1;
            }
        });

        return counts;
    }

    function bindProgressTabs() {
        document.querySelectorAll(".tab-nav a").forEach((link) => {
            link.addEventListener("click", () => {
                document.querySelectorAll(".tab-nav a").forEach((item) => item.classList.remove("tab-active"));
                link.classList.add("tab-active");
            });
        });
    }

    function formatDate(value) {
        return new Date(value).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }

    return {
        USERS_KEY,
        SESSION_KEY,
        SELECTED_WORKOUT_KEY,
        validateRegistration,
        registerUser,
        validateLogin,
        validateProfile,
        calculateImc,
        validateWorkout,
        createWorkout,
        calculateSessionStats,
        finishWorkout,
        getPersonalRecords,
        getProgressSummary,
        getDefaultWorkouts,
        initPage,
    };
});
