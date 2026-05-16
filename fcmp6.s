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
# %op0 = load float, float* @d
	la t0, d
	flw ft0, 0(t0)
	fsw ft0, -20(fp)
# %op1 = fsub float 0x0, 0x3ff028f5c0000000
	li s11, 0
	fmv.s.x ft0, s11
	li s11, 1065437102
	fmv.s.x ft1, s11
	fsub.s ft0,ft0,ft1
	fsw ft0, -24(fp)
# %op2 = fcmp ule float %op0, %op1
	flw ft0, -20(fp)
	flw ft1, -24(fp)
	flt.s t0, ft1, ft0
	xori t0, t0, 1
	sb t0, -25(fp)
# br i1 %op2, label %label3, label %label5
	lb t0, -25(fp)
	bnez t0, .main_label3
	j .main_label5
.main_label3:
# store i32 15, i32* @k
	la t1, k
	addi t0, zero, 15
	sw t0, 0(t1)
# %op4 = load float, float* @a
	la t0, a
	flw ft0, 0(t0)
	fsw ft0, -32(fp)
# call void @putfloat(float %op4)
	flw fa0, -32(fp)
	jal putfloat
# br label %label7
	j .main_label7
.main_label5:
# %op6 = load float, float* @d
	la t0, d
	flw ft0, 0(t0)
	fsw ft0, -36(fp)
# call void @putfloat(float %op6)
	flw fa0, -36(fp)
	jal putfloat
# store i32 19, i32* @k
	la t1, k
	addi t0, zero, 19
	sw t0, 0(t1)
# br label %label7
	j .main_label7
.main_label7:
# %op8 = load i32, i32* @k
	la t0, k
	lw t0, 0(t0)
	sw t0, -40(fp)
# ret i32 %op8
	lw a0, -40(fp)
	j main_exit
main_exit:
	ld ra, 40(sp)
	ld s0, 32(sp)
	addi sp, sp, 48
	ret
