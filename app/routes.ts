import { type RouteConfig, index } from "@react-router/dev/routes";
import { route } from "@react-router/dev/routes";


export default [
    index("routes/home.tsx"),
    route('/auth','routes/auth.tsx'),
    route('/upload','routes/upload.tsx'),
    route('/resume/:id','routes/resume.$id.tsx'),
    // removed convert route
    route('/resume/:id/optimize','routes/resume.$id.optimize.tsx'),
    route('/api/auth/login','routes/api.auth.login.tsx'),
    route('/api/auth/signup','routes/api.auth.signup.tsx'),
    route('/api/auth/verify','routes/api.auth.verify.tsx'),
    route('/api/resume/upload','routes/api.resume.upload.tsx'),
    route('/api/resume/list','routes/api.resume.list.tsx'),
    route('/api/resume/:id','routes/api.resume.$id.tsx'),
    route('/api/resume/delete','routes/api.resume.delete.tsx'),
    route('/api/resume/improve','routes/api.resume.improve.tsx'),
    route('/api/resume/reanalyze','routes/api.resume.reanalyze.tsx'),
    route('/api/test/gemini','routes/api.test.gemini.tsx'),
] satisfies RouteConfig;
