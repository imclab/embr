var fs = require('fs')
,   plask = require('plask')
,   em = require('../../embr-plask');

plask.simpleWindow({
    settings: {
        title:   "¡NoisE!",
        type:    "3d",
        width:   512,
        height:  512,
        vsync:   true,
        center:  true
    },

    init: function()
    {
        this.framerate(60);
        var gl = this.gl;

        this.projection = new plask.Mat4().ortho(0, 1, 0, 1, -1, 1);

        // Make Shaders
        em.Program.include("noise3D.glsl", fs.readFileSync("noise3D.glsl", "utf8"));
        this.prog_noise = new em.Program(gl, fs.readFileSync("noise.glsl", "utf8"));

        // Make Plane (for rendering FBOs)
        this.plane = em.Vbo.makePlane(gl, 0, 0, 1, 1);
        this.plane.attributes.position.location = this.prog_noise.loc_a_position;
        this.plane.attributes.texcoord.location = this.prog_noise.loc_a_texcoor
    },

    draw: function()
    {
        var gl = this.gl;

        var prog = this.prog_noise;
        prog.use();
        prog.set_u_mvp_matrix(this.projection);
        prog.set_u_time(this.frametime);
        this.plane.draw();
    }
});
