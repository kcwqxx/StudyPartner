# Global variables
	.text
	.data
	.globl k
	.align 2
	.type k, @object
	.size k, 4
k:
	.word 1234
	.globl w
	.align 3
	.type w, @object
	.size w, 8
w:
	.word 1
	.word 2
	.globl a
	.align 2
	.type a, @object
	.size a, 4
a:
	.word 1082361119
	.globl d
	.align 2
	.type d, @object
	.size d, 4
d:
	.word -1082046546
	.text
	.align 2
	.globl main
	.type main, @function
main:
	addi sp, sp, -48
	sd ra, 40(sp)
	sd s0, 32(sp)
	addi s0, sp, 48
.main_label_entry:
# %op0 = load float, float* @a
	la t0, a
	flw ft0, 0(t0)
	fsw ft0, -20(fp)
# %op1 = fcmp ueq float %op0, 0x401070a3e0000000
	flw ft0, -20(fp)
	li s11, 1082361119
	fmv.s.x ft1, s11
	feq.s t0, ft0, ft1
	sb t0, -21(fp)
# br i1 %op1, label %label2, label %label4
	lb t0, -21(fp)
	bnez t0, .main_label2
	j .main_label4
.main_label2:
# store i32 1, i32* @k
	la t1, k
	addi t0, zero, 1
	sw t0, 0(t1)
# %op3 = load float, float* @a
	la t0, a
	flw ft0, 0(t0)
	fsw ft0, -28(fp)
# call void @putfloat(float %op3)
	flw fa0, -28(fp)
	jal putfloat
# br label %label6
	j .main_label6
.main_label4:
# %op5 = load float, float* @d
	la t0, d
	flw ft0, 0(t0)
	fsw ft0, -32(fp)
# call void @putfloat(float %op5)
	flw fa0, -32(fp)
	jal putfloat
# store i32 2, i32* @k
	la t1, k
	addi t0, zero, 2
	sw t0, 0(t1)
# br label %label6
	j .main_label6
.main_label6:
# %op7 = load i32, i32* @k
	la t0, k
	lw t0, 0(t0)
	sw t0, -36(fp)
# ret i32 %op7
	lw a0, -36(fp)
	j main_exit
main_exit:
	ld ra, 40(sp)
	ld s0, 32(sp)
	addi sp, sp, 48
	ret
