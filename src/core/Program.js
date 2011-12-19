define(function(){

    "use strict";

    var kShaderPrefix         = "#ifdef GL_ES\nprecision highp float;\n#endif\n"
    ,   kVertexShaderPrefix   = kShaderPrefix + "#define EM_VERTEX\n"
    ,   kFragmentShaderPrefix = kShaderPrefix + "#define EM_FRAGMENT\n";

    // function processIncludes(src){
    //     var match, re = /^[ \t]*#include +"([\w\-\.]+)"/gm;
    //     while(match = re.exec(src)){
    //         var fn = match[1];
    //         if(fn in includes){
    //             var incl_src = includes[fn];
    //             src = src.replace(new RegExp(match[0]), incl_src);
    //             re.lastIndex = match.index + incl_src.length;
    //         }
    //     }
    //     return src;
    // }

    // function include(name, src){
    //     includes[name] = src;
    // }


    function Program(gl, src_vert, src_frag){
        this.gl = gl;

        this.handle = gl.createProgram();
        this.shader_vert = gl.createShader(gl.VERTEX_SHADER);
        this.shader_frag = gl.createShader(gl.FRAGMENT_SHADER);

        gl.attachShader(this.handle, this.shader_vert);
        gl.attachShader(this.handle, this.shader_frag);
    }

    Program.prototype = {

        compile: function(src_vert, src_frag){
            var gl = this.gl;

            if(src_vert){
                gl.shaderSource(this.shader_vert, kVertexShaderPrefix + src_vert);
                gl.compileShader(this.shader_vert);
                if(gl.getShaderParameter(this.shader_vert, gl.COMPILE_STATUS) !== true)
                    throw gl.getShaderInfoLog(this.shader_vert);
            }

            if(src_frag){
                gl.shaderSource(this.shader_frag, kFragmentShaderPrefix + src_frag);
                gl.compileShader(this.shader_frag);
                if(gl.getShaderParameter(this.shader_frag, gl.COMPILE_STATUS) !== true)
                    throw gl.getShaderInfoLog(this.shader_frag);
            }
        },

        link: function(){
            var gl = this.gl, handle = this.handle;

            gl.linkProgram(handle);
            if(gl.getProgramParameter(handle, gl.LINK_STATUS) !== true)
                throw gl.getProgramInfoLog(handle);

            function makeUniformSetter(type, location){
                switch(type){
                    case gl.BOOL:
                    case gl.INT:
                    case gl.SAMPLER_2D:
                    case gl.SAMPLER_CUBE:
                        return function(value){
                            gl.uniform1i(location, value);
                            return this;
                        };
                    case gl.FLOAT:
                        return function(value){
                            gl.uniform1f(location, value);
                            return this;
                        };
                    case gl.FLOAT_VEC2:
                        return function(v){
                            gl.uniform2f(location, v.x, v.y);
                        };
                    case gl.FLOAT_VEC3:
                        return function(v){
                            gl.uniform3f(location, v.x, v.y, v.z);
                        };
                    case gl.FLOAT_VEC4:
                        return function(v){
                            gl.uniform4f(location, v.x, v.y, v.z, v.w);
                        };
                    case gl.FLOAT_MAT3:
                        return function(mat4){
                            gl.uniformMatrix3fv(location, false, mat4.to3x3Float32Array());
                        };
                    case gl.FLOAT_MAT4:
                        return function(mat4){
                            gl.uniformMatrix4fv(location, false, mat4.toFloat32Array());
                        };
                }
                return function(){
                    throw "Unknown uniform type: " + type;
                };
            }

            this.uniforms = {};
            this.locations = {};

            var i, info, location;
            var nu = gl.getProgramParameter(handle, gl.ACTIVE_UNIFORMS);
            for(i = 0; i < nu; ++i){
                info     = gl.getActiveUniform(handle, i);
                location = gl.getUniformLocation(handle, info.name);
                this.uniforms[info.name] = makeUniformSetter(info.type, location);
                this.locations[info.name] = location;
            }

            var na = gl.getProgramParameter(handle, gl.ACTIVE_ATTRIBUTES);
            for(i = 0; i < na; ++i){
                info     = gl.getActiveAttrib(handle, i);
                location = gl.getAttribLocation(handle, info.name);
                this.locations[info.name] = location;
            }

            return this;
        },

        assignLocations: function(vbo){
            for(var attr in vbo.attributes){
                if(attr in this.locations)
                    vbo.attributes[attr].location = this.locations[attr];
            }
        },

        use: function(uniforms){
            this.gl.useProgram(this.handle);
            if(uniforms){
                for(var name in uniforms){
                    if(name in this.uniforms)
                        this.uniforms[name](uniforms[name]);
                }
            }
        },

        dispose: function(){
            this.gl.deleteShader(this.shader_vert);
            this.gl.deleteShader(this.shader_frag);
            this.gl.deleteProgram(this.handle);
        }

    };


    return Program;

});
