<div class="navbar">
	<slot></slot>
</div>

<style>
.navbar {
  background-color: #569561;
  border-bottom: 2px solid #4C724F;
  text-align: left;
  padding: 10px 10px 5px 50px;
  display: flex;             /* enable horizontal layout */
  align-items: center;       /* align children to center */
  gap: 10px;                 /* optional spacing */
}
</style>